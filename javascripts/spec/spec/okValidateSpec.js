describe("okValidate", function() {
  function fail(){ expect(true).toEqual(false); }

  describe("Serializing",function(){
    it("should be able to serialize a input into an object", function() {
      expect($("<input type='text' name='person[name]' value='John' />").serializeObject()).toEqual({person: { name: 'John' }});
      expect($("<input type='text' name='person[address][city]' value='New York' />").serializeObject()).toEqual({person: {address: {city: 'New York'}}});
      expect($("<input type='text' name='person[books][][title]' value='Book' />").serializeObject()).toEqual({person: { books: [{ title : 'Book'} ] } });
    });

    it("should be able to serialize a unchecked checkbox into an object", function() {
      expect($("<input type='checkbox' name='person[books][][title]' value='Book' />").serializeObject()).toEqual({person: { books: [{ title : null} ] } });
    });

    it("should be able to serialize checked checkboxes into an object", function() {
      var html = "<input type='checkbox' name='person[books][][author]' value='Author' checked='checked' />" +
                 "<input type='checkbox' name='person[books][][title]' value='Title 1' checked='checked' />" +
                 "<input type='checkbox' name='person[books][][title]' value='Title 2' checked='checked' />" +
                 "<input type='checkbox' name='person[books][][title]' value='Title 3' checked='checked' />";

      expect($(html).serializeObject()).toEqual({
        person: { 
          books: [
            { title : 'Title 1', author: 'Author'},
            { title : 'Title 2'},
            { title : 'Title 3'}
          ] 
        } 
      });
    });

    it("should be able to serialize checked checkboxes into an plain array", function() {
      var html = "<input type='checkbox' name='title[]' value='Title 1' checked='checked' />" +
                 "<input type='checkbox' name='title[]' value='Title 2' checked='checked' />" +
                 "<input type='checkbox' name='title[]' value='Title 3' checked='checked' />";

      expect($(html).serializeObject()).toEqual({ title: ['Title 1', 'Title 2', 'Title 3' ] });
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

  describe("Rules",function(){
    describe("required",function(){
      it("should regard empty or arrays with all falsey-values as failing validation",function(){
        var o1 = { pets: [] },
            o2 = { pets: [null,false,undefined] },
            o3 = { pets: [0] },
            rules  = { pets: {required: true } },
            expectedErrors = { pets : { required : 'This field is required.' } };

        $.okValidate(o1,rules).fail(function(errors){
          expect(expectedErrors).toEqual(errors);
        });
        $.okValidate(o2,rules).fail(function(errors){
          expect(expectedErrors).toEqual(errors);
        });
        $.okValidate(o3,rules).fail(function(errors){
          expect(expectedErrors).toEqual(errors);
        });
      });

      it("should regard arrays with non falsey-values as passing validation",function(){
        var obj   = { pets: [1,null,2,false] },
            rules = { pets: {required: true } };

        $.okValidate(obj,rules).done(function(errors){
          expect({pets:{}}).toEqual(errors);
        });
      });
    });

    describe('number',function(){
      var rules = { field : { number : true } };

      it("should fail if it's not a number",function(){
        $.each(['foo',NaN,null,undefined,false, new Date()],function(i,v){
          $.okValidate({field: v},rules).fail(function(errors){
            expect(errors.field.number).toEqual(jasmine.any(String));
          });
        });
      });

      it("should pass if it's a number",function(){
        $.each([0,1.0,-1],function(i,v){
          $.okValidate({field: v},rules).done(function(errors){
            expect(errors.field.number).not.toEqual(jasmine.any(String));
          });
        });
      });
    });
    
    describe('email',function(){
      var rules = { field : { email : true } };

      it("should fail if it's not a valid email",function(){
        $.each(['','foo',1,"foo@", "foo@bar"],function(i,v){
          $.okValidate({field: v},rules).fail(function(errors){
            expect(errors.field.email).toEqual(jasmine.any(String));
          });
        });
      });

      it("should pass if it's a valid email",function(){
        $.okValidate({field: "foo@bar.com"}, rules).done(function(errors){
          expect(errors.field.email).not.toEqual(jasmine.any(String));
        });
      });
    });
		
    describe('url',function(){
      var rules = { field : { url : true } };

      it("should fail if it's not a valid email",function(){
        $.each(['','foo',1,"foo@", "foo@bar", 'http'],function(i,v){
          $.okValidate({field: v},rules).fail(function(errors){
            expect(errors.field.url).toEqual(jasmine.any(String));
          });
        });
      });

      it("should pass if it's a valid email",function(){
        $.each(['foo.com','http://foo.com', 'https://www.foo.com', 'ftp://foo.com'],function(i,v){
          $.okValidate({field: v},rules).done(function(errors){
            expect(errors.field.url).not.toEqual(jasmine.any(String));
          });
        });
      });
    });
		
    describe('date',function(){
      var rules = { field : { date : true } },
          valid = [
            1375654376888,
            "2010",
            "2010-01",
            "2010-01-01",
            "February 3, 2001",
            "February 3 2001",
            "2010-06-09T15:20:00Z",
            "2010-06-09T15:20:00-07:00",
            "2010 June 9",
            "6/9/2010 3:20 pm"
          ],
          invalid = [ 
            3.14,
            "foo", 
            "", 
            "Dog Doo 9" 
          ];

      it("should pass if it's a valid dateString or milliseconds",function(){
        $.each(valid,function(i,v){
          $.okValidate({field: v},rules).done(function(errors){
            expect(errors.field.url).not.toEqual(jasmine.any(String));
          });
        });
      });
      it("should fail if it's not a dateString or milliseconds",function(){
        $.each(invalid,function(i,v){
          $.okValidate({field: v},rules).fail(function(errors){
            expect(errors.field.date).toEqual(jasmine.any(String));
          });
        });
      });
    });
		
    describe('step',function(){
      var valid = {
        'any' : 42,
        1 : 2,
        3 : 9,
        5 : 25
      },
      invalid = {
        1 : 0,
        3 : 8,
        5 : 13
      };

      it("should pass if it's a valid step or 'any'",function(){
        $.each(valid,function(step, value){
          $.okValidate({ field: value }, { field : { step : step } }).done(function(errors){
            expect(errors.field.step).not.toEqual(jasmine.any(String));
          });
        });
      });

      it("should fail if it's a invalid step",function(){
        $.each(invalid,function(step, value){
          $.okValidate({ field: value }, { field : { step : step } }).fail(function(errors){
            expect(errors.field.step).toEqual(jasmine.any(String));
          });
        });
      });
    });
    
    describe('range',function(){
      describe("given a single value",function(){
        it("should pass if it is inside the range",function(){
          $.okValidate({ field: 3 }, { field : { range : 3 } })
          .done(function(errors){
            expect(errors.field.range).not.toEqual(jasmine.any(String));
          })
          .fail(function(){ fail(); });

          $.okValidate({ field: [1,2,3] }, { field : { range : 3 } })
          .done(function(errors){
            expect(errors.field.range).not.toEqual(jasmine.any(String));
          })
          .fail(function(){ fail(); });
        });

        it("should fail if not not inside the range",function(){
          $.okValidate({ field: 10 }, { field : { range : 3 } }).fail(function(errors){
            expect(errors.field.range).toEqual(jasmine.any(String));
          });

          $.okValidate({ field: [1,2,3,4] }, { field : { range : 3 } }).fail(function(errors){
            expect(errors.field.range).toEqual(jasmine.any(String));
          });
        });
      });

      describe("given two values",function(){
        it("should pass if it is equal to the range",function(){
          $.okValidate({ field: 2 }, { field : { range : [2,4] } })
          .done(function(errors){
            expect(errors.field.range).not.toEqual(jasmine.any(String));
          })
          .fail(function(){ fail(); });

          $.okValidate({ field: 3 }, { field : { range : [2,4] } })
          .done(function(errors){
            expect(errors.field.range).not.toEqual(jasmine.any(String));
          })
          .fail(function(){ fail(); });

          $.okValidate({ field: 4 }, { field : { range : [2,4] } })
          .done(function(errors){
            expect(errors.field.range).not.toEqual(jasmine.any(String));
          })
          .fail(function(){ fail(); });


          $.okValidate({ field: [1,2,3,4] }, { field : { range : [2,4] } })
          .done(function(errors){
            expect(errors.field.range).not.toEqual(jasmine.any(String));
          })
          .fail(function(){ fail(); });
        });

        it("should fail if not equal to the range",function(){
          $.okValidate({ field: 1 }, { field : { range : [2,4] } }).done(function(errors){
            expect(errors.field.range).not.toEqual(jasmine.any(String));
          });

          $.okValidate({ field: 5 }, { field : { range : [2,4] } }).done(function(errors){
            expect(errors.field.range).not.toEqual(jasmine.any(String));
          });

          $.okValidate({ field: [1] }, { field : { range : [2,4] } }).done(function(errors){
            expect(errors.field.range).not.toEqual(jasmine.any(String));
          });
        });
      });
    });
		
    describe('max',function(){
      it("should pass if less than or equal to the max",function(){
        $.okValidate({ field: 2 }, { field : { max : 3 } }).done(function(errors){
          expect(errors.field.max).not.toEqual(jasmine.any(String));
        })
        .fail(function(){ fail(); });

        $.okValidate({ field: 3 }, { field : { max : 3 } }).done(function(errors){
          expect(errors.field.max).not.toEqual(jasmine.any(String));
        })
        .fail(function(){ fail(); });

        $.okValidate({ field: [1,2,3] }, { field : { max : 3 } }).done(function(errors){
          expect(errors.field.max).not.toEqual(jasmine.any(String));
        })
        .fail(function(){ fail(); });
      });

      it("should fail if greater than the max",function(){
        $.okValidate({ field: 10 }, { field : { max : 3 } }).fail(function(errors){
          expect(errors.field.max).toEqual(jasmine.any(String));
        });

        $.okValidate({ field: [1,2,3,4,5] }, { field : { max : 3 } }).done(function(errors){
          expect(errors.field.max).toEqual(jasmine.any(String));
        });
      });
    });
		
    describe('min',function(){
      it("should pass if greater than or equal to the min",function(){
        $.okValidate({ field: 4 }, { field : { min : 3 } }).done(function(errors){
          expect(errors.field.min).not.toEqual(jasmine.any(String));
        })
        .fail(function(){ fail(); });

        $.okValidate({ field: 3 }, { field : { min : 3 } }).done(function(errors){
          expect(errors.field.min).not.toEqual(jasmine.any(String));
        })
        .fail(function(){ fail(); });

        $.okValidate({ field: [1,2,3] }, { field : { min : 3 } }).done(function(errors){
          expect(errors.field.min).not.toEqual(jasmine.any(String));
        })
        .fail(function(){ fail(); });
      });
      it("should fail if less than the min",function(){
        $.okValidate({ field: 2 }, { field : { min : 3 } }).fail(function(errors){
          expect(errors.field.min).toEqual(jasmine.any(String));
        });

        $.okValidate({ field: [1,2] }, { field : { min : 3 } }).fail(function(errors){
          expect(errors.field.min).toEqual(jasmine.any(String));
        });
      });
    });
		
    describe('pattern',function(){
      it("should pass if matches the pattern",function(){
        $.okValidate({ field: 'food' }, { field : { pattern : 'foo?' } }).done(function(errors){
          expect(errors.field.pattern).not.toEqual(jasmine.any(String));
        });
      });
      it("should fail if it doesn't match the pattern",function(){
        $.okValidate({ field: 'bar' }, { field : { pattern : 'foo?' } }).fail(function(errors){
          expect(errors.field.pattern).toEqual(jasmine.any(String));
        });
      });
    });
		
    describe('maxlength',function(){
      it("should pass if less than or equal to the max length",function(){
        $.okValidate({ field: 'fo' }, { field : { maxlength : 3 } }).done(function(errors){
          expect(errors.field.maxlength).not.toEqual(jasmine.any(String));
        });
        $.okValidate({ field: 'foo' }, { field : { maxlength : 3 } }).done(function(errors){
          expect(errors.field.maxlength).not.toEqual(jasmine.any(String));
        });
      });
      it("should fail if greater than the max length",function(){
        $.okValidate({ field: 'food' }, { field : { maxlength : 3 } }).fail(function(errors){
          expect(errors.field.maxlength).toEqual(jasmine.any(String));
        });
      });
    });
		
    describe('minlength',function(){
      it("should pass if greater than or equal to the min length",function(){
        $.okValidate({ field: 'food' }, { field : { minlength : 3 } }).done(function(errors){
          expect(errors.field.minlength).not.toEqual(jasmine.any(String));
        });
        $.okValidate({ field: 'foo' }, { field : { minlength : 3 } }).done(function(errors){
          expect(errors.field.minlength).not.toEqual(jasmine.any(String));
        });
      });
      it("should fail if less than the min length",function(){
        $.okValidate({ field: 'fo' }, { field : { minlength : 3 } }).fail(function(errors){
          expect(errors.field.minlength).toEqual(jasmine.any(String));
        });
      });
    });
		
    describe('rangelength',function(){
      describe("given two values",function(){
        it("should pass if it is inside the range",function(){
          $.okValidate({ field: 'foo' }, { field : { rangelength : 3 } })
          .done(function(errors){
            expect(errors.field.rangelength).not.toEqual(jasmine.any(String));
          })
          .fail(function(){ fail(); });
        });
        it("should fail if not not inside the range",function(){
          $.okValidate({ field: 'foodie' }, { field : { rangelength : 3 } }).fail(function(errors){
            expect(errors.field.rangelength).toEqual(jasmine.any(String));
          });
        });
      });
      describe("given a single value",function(){
        it("should pass if it is equal to the range",function(){
          $.okValidate({ field: 'fo' }, { field : { rangelength : [2,4] } })
          .done(function(errors){
            expect(errors.field.rangelength).not.toEqual(jasmine.any(String));
          })
          .fail(function(){ fail(); });

          $.okValidate({ field: 'foo' }, { field : { rangelength : [2,4] } })
          .done(function(errors){
            expect(errors.field.rangelength).not.toEqual(jasmine.any(String));
          })
          .fail(function(){fail(); });

          $.okValidate({ field: 'food' }, { field : { rangelength : [2,4] } })
          .done(function(errors){
            expect(errors.field.rangelength).not.toEqual(jasmine.any(String));
          })
          .fail(function(){ fail(); });
        });
        it("should fail if not equal to the range",function(){
          $.okValidate({ field: 'f' }, { field : { rangelength : [2,4] } }).done(function(errors){
            expect(errors.field.rangelength).not.toEqual(jasmine.any(String));
          });
          $.okValidate({ field: 'foodie' }, { field : { rangelength : [2,4] } }).done(function(errors){
            expect(errors.field.rangelength).not.toEqual(jasmine.any(String));
          });
        });
      });
    });
		
    describe('remote',function(){
      var object = { email: 'asher@okbreathe.com' },
          rules = { email : { remote : 'http://okbreathe.com' } },
          onSuccess,
          onFailure,
          request, 
          resp = {
            success: {
              status: 200,
              responseText: '{ "success": true, "message" : "Email is valid" }'
            },
            failure: {
              status: 400,
              responseText: '{ "success": false, "message" : "Email has been taken" }'
            }
          };

      beforeEach(function(){
        jasmine.Ajax.useMock();

        onSuccess = jasmine.createSpy('onSuccess');
        onFailure = jasmine.createSpy('onFailure');

        $.okValidate(object,rules).fail(onFailure).done(onSuccess);

        request = mostRecentAjaxRequest();
      });

      describe("on success", function(){
        beforeEach(function(){
          request.response(resp.success);
        });

        it("calls onSuccess", function(){
          expect(onSuccess).toHaveBeenCalled();
        });

        it("does not call onFailure", function(){
          expect(onFailure).not.toHaveBeenCalled();
        });
      });

      describe("on failure", function(){
        beforeEach(function(){
          request.response(resp.failure);
        });

        it("does not call onSuccess", function(){
          expect(onSuccess).not.toHaveBeenCalled();
        });

        it("calls onFailure", function(){
          expect(onFailure).toHaveBeenCalled();
        });
      });

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

    it("should work with complex and nested objects",function(){
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
