var forms = (function (exports) {
  'use strict';

  function Form(id){
    let form = typeof id === 'string' ? document.querySelector(`form[data-id="${id}"]`) : new Error('The id paramter must be a valid string');
    if(form.constructor.name === 'Error'){ throw form }
    else if(form === undefined || form === null){ throw new Error(`The form with the following attriubte was not found --> data-id="${id}"`) }
    else if( form.children.length === 0 ){ throw new Error('The following Form is empty not containing buttons or inputs')}
    const INPUTS = {
      name: {},
      type: {},
      add: function(input){
        let exist = undefined ;
        if(input.name && typeof input.name === 'string' && input.name !== '' ){
          exist = INPUTS.name[input.name];
          if(exist && input.type !== 'radio'){ throw new Error('The name attribute associated to this input already exist.') }
          else if(exist && input.type === 'radio'){ exist.push(input); }
          else if(!exist && input.type === 'radio'){ INPUTS.name[input.name] = [input]; }
          else if(!exist){ INPUTS.name[input.name] = input; }
        }
        else{ throw new Error('The input is must have a name attribute') }

        if(input.tagName === 'INPUT' && typeof input.type === 'string' ){
          exist = INPUTS.type[input.type];
          if(exist){ exist.push(input); }
          else{ INPUTS.type[input.type] = [input]; }
        }
      },
      collect: function(where){
        let result = [];
        if(where && typeof where === 'object'){
          if(where.type && typeof where.type === 'string'){
            INPUTS.type[where.type].forEach((input)=>{result.push(input);});
          }
          else if (where.name && typeof where.name === 'string'){
            if(INPUTS.name[where.name].type === 'radio'){
              result.push(INPUTS.name[where.name].filter((input)=>{ return input.attributes['checked'] }));
            }
            else{
              result.push(INPUTS.name[where.name]);
            }
          }
          else{
            throw new Error('The where paramter must be an object with either a type or name property --> {type: string} || {name: string}')
          }
        }
        else{
          for(let input in INPUTS.name){
            if(INPUTS.name[input].type === 'radio'){
              result.push(INPUTS.name[input].filter((input)=>{ return input.attributes['checked'] }));
            }
            else{
              result.push(INPUTS.name[input]);
            }
          }
        }

        return result

      }
    };

    // find the inputs, buttons and error views inside the form.
    {
      let current = undefined, child = undefined, i = 0, search = [] , unless = undefined;
      unless = [
        {
          condition: (node)=>{ return ['INPUT','SELECT','TEXTAREA'].indexOf(node.tagName) !== -1 },
          execute: (node)=>{ INPUTS.add(node); }
        },
        {
          condition: (node)=>{ return node.tagName === 'BUTTON' },
          execute: (node)=>{ }
        },
        {
          condition: (node)=>{ return (node.attributes['data-view'] && node.attributes['data-view'].value === 'error') },
          execute: (node)=>{ }
        }
      ];

      for(child of form.children){ search.push(child); }
      while(i < search.length){
        current = search[i];
        if(current.children.length){ for(child of current.children){ search.push(child); } }
        unless.forEach((test)=>{ if(test.condition(current)){ test.execute(current); } });
        i++;
      }
    }


    this.collect = INPUTS.collect;

    // this.validate = RULES.validate
    //
    // this.rules = {
    //   register: (register)=>{
    //     if(typeof register != 'object' || typeof register.name !== 'string' || typeof register.rule !== 'function' ){
    //       throw new Error('The register paramter must adhere to the following structure ---> {name: string, rule: function }');
    //     }
    //     let test = register.rule.call(ERROR.response,{value: false});
    //     if(typeof test !== 'object'  || typeof test.error !== 'boolean' || typeof test.message !== 'string' ){
    //       throw new Error('The rule function must return a response object --> { error: boolean, message: string }');
    //     }
    //     RULES.available[register.name] = register.rule
    //   },
    //   check: (against)=>{
    //     if(typeof against !== 'object' || typeof against.input !== 'object' || !Array.isArray(against.rules)){
    //       throw new Error('The against paramter must adhere to the following structure --> {input: {name: string, type: string, attrs: object }, rules: [string ,string] }')
    //     }
    //     against.inputs = COLLECT(against.input); let missing = '';
    //     against.rules.forEach((rule)=>{ if(RULES.available[rule] === undefined){ missing += (rule+', ') } })
    //     if(missing.length){ throw new Error('The following rule names do not exist --> '+missing )}
    //     if(against.inputs.length){
    //       RULES.check.push({inputs:against.inputs,rules:against.rules})
    //     }
    //     else{ throw new Error('The input query you passed did not return any inputs') }
    //   }
    // }
    //
    // this.buttons = {
    //   register: function(register,listen = false){
    //     //{button:string, type: string, handler: {'name':function }}
    //     if(typeof register !== 'object' || typeof register.button !== 'string' || typeof register.type !== 'string'
    //     || typeof register.handler !== 'object' || Object.keys(register.handler).length > 1 ){
    //       throw new Error('The register paramter must adhere to the following structure --> {button: string, type: string, handler:{ name:function } }');
    //     }
    //
    //     let button = BUTTONS.find((button)=>{ return button.name === register.button });
    //     if(button === undefined){ throw new Error(`The button ${register.name} was not found inside your form`)}
    //     if(button.registeredEvents === undefined ){ button.registeredEvents = {} }
    //     if(button.registeredEvents[register.type] ===  undefined ){ button.registeredEvents[register.type] = {} }
    //     let name = Object.keys(register.handler)[0]
    //     if(typeof button.registeredEvents[register.type][name] === 'function'){
    //       throw new Error('Could not register event, a duplicate event exist under the same type and name');
    //     }
    //     else{
    //       button.registeredEvents[register.type][name] = register.handler[name]
    //     }
    //
    //     if(listen){
    //       this.listen({listen: true, button: button.name, type: register.type, name: name});
    //     }
    //
    //   },
    //   listen: function(action){
    //     //{listen: boolean, type: string, name: string, button: string}
    //     if(typeof action !== 'object' || typeof action.listen !== 'boolean' || typeof action.button !== 'string' || typeof action.name !== 'string' || typeof action.type !== 'string'){
    //       throw new Error('The paramter must adhere to the following structure --> {listen: boolean, type: string, name: string, button: string}')
    //     }
    //     action.button = BUTTONS.find((button)=>{ return button.name === action.button });
    //     if(action.button === undefined){ throw new Error('The button name you are supplying does not exist inside this form')}
    //     action.name = action.button.registeredEvents[action.type][action.name]
    //     if(action.name === undefined){ throw new Error('The action name you supplyed could not be found registered to this button') }
    //     if(action.listen){
    //       action.button.addEventListener(action.type,action.name.bind({collect:COLLECT,validate:RULES.validate,send: SEND, error: ERROR.view }))
    //     }
    //     else{
    //       action.button.removeEventListener(action.type,action.name)
    //     }
    //
    //   }
    // }
    //
    // this.send = SEND

  }

  exports.singup = undefined;

  document.addEventListener('DOMContentLoaded',function(e){
    exports.singup = new Form('signUp');

  });

  return exports;

}({}));
