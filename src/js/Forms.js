
function Form(id){
  let form = typeof id === 'string' ? document.querySelector(`form[data-id="${id}"]`) : new Error('The id paramter must be a valid string');
  if(form.constructor.name === 'Error'){ throw form }
  else if(form === undefined || form === null){ throw new Error(`The form with the following attriubte was not found --> data-id="${id}"`) }
  else if( form.children.length === 0 ){ throw new Error('The following Form is empty not containing buttons or inputs')}
  const INPUTS = {
    name: {},
    type: {},
    add: (input)=>{
      let exist = undefined ;
      if(input.name && typeof input.name === 'string' && input.name !== '' ){
        exist = INPUTS.name[input.name]
        if(exist && input.type !== 'radio'){ throw new Error('The name attribute associated to this input already exist.') }
        else if(exist && input.type === 'radio'){ exist.push(input) }
        else if(!exist && input.type === 'radio'){ INPUTS.name[input.name] = [input] }
        else if(!exist){ INPUTS.name[input.name] = input }
      }
      else{ throw new Error('The input is must have a name attribute') }

      if(input.tagName === 'INPUT' && typeof input.type === 'string' ){
        exist = INPUTS.type[input.type]
        if(exist){ exist.push(input) }
        else{ INPUTS.type[input.type] = [input] }
      }

      input.rules = []

    },
    collect: (where)=>{
      let result = []
      if(where && typeof where === 'object'){
        if(where.type && typeof where.type === 'string'){
          INPUTS.type[where.type].forEach((input)=>{result.push(input)})
        }
        else if (where.name && typeof where.name === 'string'){
          if(INPUTS.name[where.name].type === 'radio'){
            result.push(INPUTS.name[where.name].filter((input)=>{ return input.attributes['checked'] }))
          }
          else{
            result.push(INPUTS.name[where.name])
          }
        }
        else{
          throw new Error('The where paramter must be an object with either a type or name property --> {type: string} || {name: string}')
        }
      }
      else{
        for(let input in INPUTS.name){
          if(INPUTS.name[input].type === 'radio'){
            result.push(INPUTS.name[input].filter((input)=>{ return input.attributes['checked'] }))
          }
          else{
            result.push(INPUTS.name[input])
          }
        }
      }

      return result

    }
  }
  const BUTTONS = []
  const ERROR = {view: undefined, list:[], response:{error: false, message: ''} }
  const RULES = {
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
    add: (rule)=>{
      if(rule && typeof rule === 'object' && typeof rule.name === 'string' && typeof rule.test === 'function'){
        let response = rule.test()
        if(typeof response.error === 'boolean' && typeof response.message === 'string'){
          RULES.available[rule.name] = rule.test
        }
        else{
          throw new Error('The test function must return a response with the following structure --> {error: true, message: string }');
        }

      }
      else{
        throw new Error('The paramter must adhere to the following structure --> {name: string, test: function }')
      }
    },
    register: (register)=>{
      if(typeof register === 'object' && (typeof register.input === 'object' || Array.isArray(register) ) && Array.isArray(register.rules) ){
        let inputs = [], missing = undefined
        if(register.rules.some((name)=>{ missing = RULES.available[name] === undefined; if(missing){ missing = name } return missing  })){
          throw new Error('The following rule could not be found --> '+missing)
        }

        if(Array.isArray(register.input)){
           register.input.forEach((query,i,array)=>{
             query = INPUT.collect(query)
             if(query.length){ query.forEach((input)=>{ inputs.push(input) }) }
             else{ throw new Error('The query at the following index '+i+'was empty')}
           })
        }
        else{
          inputs = INPUTS.collect(register.input)
          if(inputs.length === 0){ throw new Error('The input query you provided was empty') }
        }

        inputs.forEach((input)=>{
          register.rules.forEach((rule)=>{ if(input.rules.indexOf(rule) === -1){ input.rules.push(rule) } })
        })

      }
      else{
        throw new Error('The paramter must adhere to the following structure --> {input: [] || {type: string} || {name: string} , rules: [function,function,...] }')
      }
    },
    validate: ()=>{
      ERROR.list = []
      this.collect().forEach((input)=>{
        if(input.rules.length){ input.rules.forEach((rule)=>{ rule = RULES.available[rule](input); if(rule.error){ ERROR.list.push({input:input,message:rule.message}) }  }) }
      })
      return {list: ERROR.list,view: ERROR.view}
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
        execute: (node)=>{ INPUTS.add(node) }
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

  this.collect = INPUTS.collect
  this.rules = {
    register: RULES.register,
    add: RULES.add
  }
  this.validate = RULES.validate
  // this.validate = RULES.validate

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


export { Form }
