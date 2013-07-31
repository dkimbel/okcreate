describe("okValidate", function() {

  describe("Serializing",function(){
    it("should be able to serialize a input into an object", function() {
      expect($("<input type='text' name='person[name]' value='John' />").serializeObject()).toEqual({person: { name: 'John' }});
      expect($("<input type='text' name='person[address][city]' value='New York' />").serializeObject()).toEqual({person: {address: {city: 'New York'}}});
      expect($("<input type='text' name='person[books][][title]' value='Book' />").serializeObject()).toEqual({person: { books: [{ title : 'Book'} ] } });
    });

    it("should be able to serialize a unchcecked checkbox into an object", function() {
      expect($("<input type='checkbox' name='person[books][][title]' value='Book' />").serializeObject()).toEqual({person: { books: [{ title : null} ] } });
    });

    it("should be able to serialize multiple inputs",function(){
      var inputs = $("<input type='text' name='person[first_name]' value='John' /><input type='text' name='person[last_name]' value='Doe' />");
      expect(inputs.serializeObject()).toEqual({person: { first_name: 'John', last_name: 'Doe' }});
    });
  });

  describe("de-serializing",function(){
    it("should be able to de-serialize and object into an input name",function(){
      expect($.deserializeObject({person: { name: 'John' } })).toEqual([{name: "person[name]", value: "John"}]);
      expect($.deserializeObject({person: { books: [{ title : 'Book'} ] } })).toEqual([{name:"person[books][][title]", value:'Book'}]);
    });
  });

  describe("Validation",function(){
    it("should work with simple fields", function(){
      var object = { name: "", age: "NaN" },
          rules  = { name: {required: true, minlength: 10 }, age: {number: true} },
          expectedErrors = { name: { required : 'This field is required.', minlength: 'Please enter at least 10 characters.'}, age: {number : "Please enter a number" } };
   
      $.okValidate(object,rules).fail(function(errors){
        expect(expectedErrors).toEqual(errors);
      });
    });

    it("should work with simple arrays", function(){
      var object = { pets: ['Dog'] },
          rules  = { pets: {required: true, min: 2 } },
          expectedErrors = { pets : { min : 'Please enter a value greater than or equal to 2.' } };
   
      $.okValidate(object,rules).fail(function(errors){
        expect(expectedErrors).toEqual(errors);
      });

      object = { pets: ['Dog','Cat'] };

      // TODO Need a a better way of verifying that this is called
      $.okValidate(object,rules).done(function(errors){
        expect(true).toEqual(true);
      });
    });

    it("should apply rules to arrays with empty objects", function(){
      var object = { user: { books: [{ authors: [{}] }] } },
          rules  = { user: { books: { authors: { name: { required:true, minlength:1 } } } } },
          expectedErrors = { user: { books: [ { authors: [ { name: { required : 'This field is required.', minlength: 'Please enter at least 1 characters.'} } ] } ] } };

      $.okValidate(object,rules).fail(function(errors){
        expect(expectedErrors).toEqual(errors);
      });
    });

    it("should NOT apply rules to empty arrays", function(){
      var object = { user: { books: [{ authors: [] }] } },
          rules  = { user: { books: { authors: { name: { required:true, minlength:1 } } } } },
          expectedErrors = { user: { books: [ { authors: [] } ] } };

      $.okValidate(object,rules).fail(function(errors){
        expect(expectedErrors).toEqual(errors);
      });
    });

    it("should work with complex and nested objets",function(){
      var object = { 
        user: {
          first_name: "",
          last_name:  "Doe",
          pets: ['Dog'],
          email: "",
          address: {
            street: "666 Hairspray Way",
            city:   "Beverly Hills",
            state:  "CAL",
            zip:    "NaN"
          },
          books: [
            {
              name: "",
              authors: [{ name: 'Anonymoose'}]
            },
            {
              name: "The Joy of Clojure",
              authors: [{ name:'Michael Fogus', age: "NaN"} , { name: 'Chris Houser' }] 
            },
            {
              name: "Purely Functional Data Structures",
              authors: []
            }
          ]
        }
      },

      rules = { 
         user: {
           first_name: { required:true, minlength:10 },
           last_name:  { required: true, minlength:3 },
           email: {email:true},
           pets: { min:2 },
           address: {
             state: { maxlength: 2 },
             zip  : { number:true },
           },
           books: { 
             name: {required:true},
             authors: {
               name: {
                 required:true,
                 minlength:1
               },
               age: {
                 number: true
               }
             }
           }
        }
      },

      expectedErrors = { 
        user : { 
          first_name : { required : 'This field is required.', minlength : 'Please enter at least 10 characters.' }, 
          last_name : { }, 
          email : { email : 'Please enter a valid email address.' }, 
          pets : { min : 'Please enter a value greater than or equal to 2.' }, 
          address : { 
            state : { maxlength : 'Please enter no more than 2 characters.' }, 
            zip : { number : 'Please enter a number' } }, 
            books : [ 
              { 
                name : { required : 'This field is required.' }, 
                authors : [ { name : { }, age : { number : 'Please enter a number' } } ] }, 
              { 
                name : { }, 
                authors : [ { name : { }, age : { number : 'Please enter a number' } }, { name : { }, age : { number : 'Please enter a number' } } ] 
              }, 
              { name : { } } 
            ] 
        } 
      };

      $.okValidate(object,rules).fail(function(errors){
        expect(expectedErrors).toEqual(errors);
      });
    });
  });

});

