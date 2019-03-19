
function Form(id){
  let form = typeof id === 'string' ? document.querySelector(`form[data-id="${id}"]`) : new Error('The id paramter must be a valid string');
  if(form.constructor.name === 'Error'){ throw form }
  else if(form === undefined || form === null){ throw new Error(`The form with the following attriubte was not found --> data-id="${id}"`) }
  else if( form.children.length === 0 ){ throw new Error('The following Form is empty not containing buttons or inputs')}
  const INPUTS = []
  const BUTTONS = []
  const ERROR = {view: undefined, list:[], response:{error: false, message: ''} }
  const RULES = {
    check:[],
    available: {
      'text:notEmpty': function(input){
        if(input.value === undefined || input.value === '' || input.value === null){
          this.error = true; this.message = `The input ${input.name} is empty`;
        }
        return this
      },
      'number:year': function(input){
        let value = Number(input.value)
        if(isNaN(value)){ this.error = true; this.message = `The input ${input.name} is not a number`; return this }
        let date = new Date();
        if(value > date.getFullYear() || (value < date.getFullYear() - 100) ){
          this.error = true; this.message = 'The input is greater than the current year or more than 100 years old '; return this
        }
        return this
      },
      'number:day': function(input){
        let value = Number(input.value)
        if(isNaN(value)){ this.error = true; this.message = `The input ${input.name} is not a number`; return this}
        if(value <= 0 || value > 31){ this.error = true; this.message = `The input ${input.name} is less than 1 or greater than 31`;  return this}
        return this
      },
      'number:month': function(input){
        let value = input.value
        if(isNaN(value)){ this.error = true; this.message = `The input ${input.name} is not a number`; return this}
        if(value <= 0 || value > 12){ this.error = true; this.message = `The input ${input.name} is less than 1 or greater 12`; return this }
        return this
      },
    },
    validate: ()=>{
      ERROR.list = []
      RULES.check.forEach((validate)=>{
        validate.inputs.forEach((input)=>{
          validate.rules.forEach((rule)=>{
            ERROR.response.error = false, ERROR.response.message = '';
            rule = RULES.available[rule].call(ERROR.response,input)
            if(rule.error){ ERROR.list.push({input:input,message:rule.message}) }
          })
        })
      })
      return ERROR.list;
    }
  }
  const SEND = function(send){
    if( typeof send !== 'object' || typeof send.url !== 'string' || typeof send.data === 'object' || typeof send.data.type !== 'string' || send.data.value === undefined){
      throw new Error('The requeset paramter must adhere to the following structure --> {url: string, data: {type: string, value: ? } }');
    }
    if(send.data.type !== 'json' || send.data.type !== 'FormData'){ throw new Error('The data type must be either JSON or FormData') }
    if(send.data.type === 'FormData' && send.data.value.constructor.name !== 'FormData'){
      throw new Error('The data type does not match the data value ');
    }
    if(send.data.type === 'json' && typeof send.data.value !== 'string'){
      throw new Error('The data type does not match the data value ');
    }

    return fetch(send.url,{body:send.data})

  }

  let copy = []

  // find the inputs, buttons and error views inside the form.
  {
    let current = undefined, child = undefined, i = 0, search = [] , unless = undefined
    unless = [
      {
        condition: (node)=>{ return ['INPUT','SELECT','TEXTAREA'].indexOf(node.tagName) !== -1 },
        execute: (node)=>{ INPUTS.push(node) }
      },
      {
        condition: (node)=>{ return node.tagName === 'BUTTON' },
        execute: (node)=>{ BUTTONS.push(node) }
      },
      {
        condition: (node)=>{ return (node.attributes['data-view'] && node.attributes['data-view'].value === 'error') },
        execute: (node)=>{ ERROR.view = node }
      }
    ]

    for(child of form.children){ search.push(child) }
    while(i < search.length){
      current = search[i];
      if(current.children.length){ for(child of current.children){ search.push(child) } }
      unless.forEach((test)=>{ if(test.condition(current)){ test.execute(current) } });
      i++;
    }
  }

  const COLLECT = (where)=>{
    let unless = [], collect = undefined, push = undefined; copy = []
    if(where !== undefined && typeof where === 'object'){
      if(where.type === undefined && where.name === undefined && where.attrs === undefined ){ throw new Error('The where paramter must have one or all properties --> { type: string, name: string , attrs: {key: value}} ')}
      if(where.type && typeof where.type !== 'string' || where.name && typeof where.name !== 'string' || where.attrs && typeof  where.attrs !== 'object'){
        throw new Error('The where paramter must adhere to the following structure --> {type: string, name: string, attr: { key: value(string) } }')
      }

      if(where.type){ unless.push((input)=>{ return input.type === where.type }) }
      if(where.name){ unless.push((input)=>{ return input.name === where.name }) }
      if(where.attrs){
        unless.push((input)=>{
          let error = false;
          for(let name in where.attrs){ if(input.attributes[name] === undefined || input.attributes[name].value !== where.attrs[name] ){ error = true; break; } }
          return !error
        })
      }
    }

    push = (input)=>{
      if(input.type !== 'radio' || input.type !== 'checkbox'){
        copy.push(input)
      }
      else if (input.attributes['checked']){ copy.push(input) }
    }
    collect = (function(){
      if(unless.length){ return (input)=>{ if( unless.every((test)=>{ return test(input) }) ){ push(input) } } }
      else { return push }
    }())

    INPUTS.forEach(collect)
    return copy
  }

  this.collect = COLLECT

  this.validate = RULES.validate

  this.rules = {
    register: (register)=>{
      if(typeof register != 'object' || typeof register.name !== 'string' || typeof register.rule !== 'function' ){
        throw new Error('The register paramter must adhere to the following structure ---> {name: string, rule: function }');
      }
      let test = register.rule.call(ERROR.response,{value: false});
      if(typeof test !== 'object'  || typeof test.error !== 'boolean' || typeof test.message !== 'string' ){
        throw new Error('The rule function must return a response object --> { error: boolean, message: string }');
      }
      RULES.available[register.name] = register.rule
    },
    check: (against)=>{
      if(typeof against !== 'object' || typeof against.input !== 'object' || !Array.isArray(against.rules)){
        throw new Error('The against paramter must adhere to the following structure --> {input: {name: string, type: string, attrs: object }, rules: [string ,string] }')
      }
      against.inputs = COLLECT(against.input); let missing = '';
      against.rules.forEach((rule)=>{ if(RULES.available[rule] === undefined){ missing += (rule+', ') } })
      if(missing.length){ throw new Error('The following rule names do not exist --> '+missing )}
      if(against.inputs.length){
        RULES.check.push({inputs:against.inputs,rules:against.rules})
      }
      else{ throw new Error('The input query you passed did not return any inputs') }
    }
  }

  this.buttons = {
    register: function(register,listen = false){
      //{button:string, type: string, handler: {'name':function }}
      if(typeof register !== 'object' || typeof register.button !== 'string' || typeof register.type !== 'string'
      || typeof register.handler !== 'object' || Object.keys(register.handler).length > 1 ){
        throw new Error('The register paramter must adhere to the following structure --> {button: string, type: string, handler:{ name:function } }');
      }

      let button = BUTTONS.find((button)=>{ return button.name === register.button });
      if(button === undefined){ throw new Error(`The button ${register.name} was not found inside your form`)}
      if(button.registeredEvents === undefined ){ button.registeredEvents = {} }
      if(button.registeredEvents[register.type] ===  undefined ){ button.registeredEvents[register.type] = {} }
      let name = Object.keys(register.handler)[0]
      if(typeof button.registeredEvents[register.type][name] === 'function'){
        throw new Error('Could not register event, a duplicate event exist under the same type and name');
      }
      else{
        button.registeredEvents[register.type][name] = register.handler[name]
      }

      if(listen){
        this.listen({listen: true, button: button.name, type: register.type, name: name});
      }

    },
    listen: function(action){
      //{listen: boolean, type: string, name: string, button: string}
      if(typeof action !== 'object' || typeof action.listen !== 'boolean' || typeof action.button !== 'string' || typeof action.name !== 'string' || typeof action.type !== 'string'){
        throw new Error('The paramter must adhere to the following structure --> {listen: boolean, type: string, name: string, button: string}')
      }
      action.button = BUTTONS.find((button)=>{ return button.name === action.button });
      if(action.button === undefined){ throw new Error('The button name you are supplying does not exist inside this form')}
      action.name = action.button.registeredEvents[action.type][action.name]
      if(action.name === undefined){ throw new Error('The action name you supplyed could not be found registered to this button') }
      if(action.listen){
        action.button.addEventListener(action.type,action.name.bind({collect:COLLECT,validate:RULES.validate,send: SEND, error: ERROR.view }))
      }
      else{
        action.button.removeEventListener(action.type,action.name)
      }

    }
  }

  this.send = SEND

}


export { Form }
