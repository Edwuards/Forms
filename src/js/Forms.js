
function Form(id){
  let form = typeof id === 'string' ? document.querySelector(`form[data-id="${id}"]`) : new Error('The id paramter must be a valid string');
  if(form.constructor.name === 'Error'){ throw form }
  else if(form === undefined || form === null){ throw new Error(`The form with the following attriubte was not found --> data-id="${id}"`) }
  else if( form.children.length === 0 ){ throw new Error('The following Form is empty not containing buttons or inputs')}
  const Self = this
  const INPUTS = {
    name: {},
    type: {},
    add: (input)=>{
      if(input.name === '' || input.name === undefined || (input.tageName === 'INPUT' && (input.type === undefined || input.type === '') ) ){ throw new Error('The input is must have a name attribute and a type if the tag is an input') }
      let exist = INPUTS.name[input.name]
      if(exist && (input.type !== 'radio' || input.type !== 'checkbox')){ throw new Error('The name attribute associated to this input already exist.') }
      else if(input.type === 'radio' || input.type === 'checbox'){ exist ? exist.push(input) : INPUTS.name[input.name] = [input] }
      else{ INPUTS.name[input.name] = input }

      if(input.tagName === 'INPUT' ){
        exist = INPUTS.type[input.type]
        exist ? exist.push(input) : INPUTS.type[input.type] = [input]
      }
      input.rules = []

    },
    get: (where)=>{
      let result = [], key = 'name', input = undefined, inputs = undefined
      if(where && typeof where === 'object'){
        key = Object.keys(where), (key.length === 1 ? (key = key[0], (['type','name'].indexOf(key) !== -1 ? inputs = INPUTS[key][where[key]] : key = false ) ) : (key = false));
        if(!key || typeof where[key] !== 'string'){ throw new Error('The where paramter must be one of the following structures --> {type: string} || {name: string}') }
        if(Array.isArray(inputs)){
          inputs.forEach((input)=>{
            if(input.type === 'radio' || input.type === 'checkbox'){
              input.filter((input)=>{ return input.attributes['checked'] }).forEach((input)=>{ results.push(input) })
            }else{
              result.push(input)
            }
          })
        }else{ result.push(inputs) }

      }
      else{
        for(let input in INPUTS.name){
          input = INPUTS.name[input]
          if(input.type === 'radio' || input.type === 'checkbox'){
            input.filter((input)=>{ return input.attributes['checked'] }).forEach((input)=>{ results.push(input) })
          }else{
            result.push(input)
          }
        }
      }


      return result

    },
    format:{
      json: ()=>{
        let data = {}, readFile = new FileReader()
        INPUTS.get().forEach((input)=>{
          if(input.type === 'file'){
            if(!data.files){ data.files = {} }
            let file = undefined, type = undefined, length = input.files.length
            readFile.onload = ()=>{
              type = file.type.split('/')[1];
              if(!data.files[type]){ data.files[type] = [] }
              data.files[type].push({name: file.name, size: file.size, data: readFile.result.split('base64,')[1] });
              read()
            }
            let read = ()=>{
              if(length){
                file = input.files[length - 1]
                readFile.readAsDataURL(file)
                length--
              }
            }
            read()

          }
          else{
            data[input.name] = input.value
          }
        })
        return { body: data, headers:{'Content-Type':'application/json'} }
      },
      formData: ()=>{
        let data = new FormData();
        INPUTS.get().forEach((input)=>{
          if(input.type === 'file'){
            let i = 0;
            while(i < input.files.legnth){ data.append(input.name,input.files[i],input.files[i].name); i++; }
          }
          else{ data.append(input.name,input.value) }
        })

        return { body: data }
      }
    },
    send: (url,options)=>{
      if(url === undefined || typeof url !== 'string' || options === undefined || typeof options !== 'object'){
        throw new Error('The url must be a string and the options paramter an object with valid Request properties, use this link as a reference --> https://developer.mozilla.org/en-US/docs/Web/API/Request/Request')
      }
      let valid = ['headers','body','mode','credentials','cache','redirect','referrer','integrity'], request = { method: 'POST' }
      for(let name in options){ if(valid.indexOf(name) !== -1){ request[name] = options[name]} }
      return fetch(url,request)
    }
  }
  const BUTTONS = {
    name: {},
    get:(name)=>{
      if(name && typeof name === 'string'){
        if(BUTTONS.name[name]){ return BUTTONS.name[name] }
        else{ throw new Error('The button under the name '+name+' does not exist inside this form'); }
      }
      else{
        let result = []
        for(let button in BUTTONS.name){
          result.push(BUTTONS.name[button])
        }
        return result
      }
    },
    add:(node)=>{
      if(typeof node.name === undefined || typeof node.name !== 'string'){ throw new Error('The button needs a name attribute');}
      BUTTONS.name[node.name] = node
      node.register = BUTTONS.register
      node.listen = BUTTONS.listen
      node.actions = {}
    },
    register: function(action){
      if(typeof action !== 'object' || typeof action.type !== 'string' || typeof action.handler !== 'object' ){
        throw new Error('The action paramter must adhere to the following structure --> {type: string, handler: {key: function }}')
      }
      let key = Object.keys(action.handler);
      if(key.length !== 1 || typeof action.handler[key[0]] !== 'function' ){
        throw new Error('The handler must adhere to the following format --> handler: { string: function() }')
      }
      key = key[0]
      if(this.actions[action.type] === undefined ){ this.actions[action.type] = {} }
      this.actions[action.type][key] = (e)=>{ e.preventDefault();  action.handler[key].call({button: this, inputs: Self.inputs },e) }
      if(action.listen === undefined || typeof action.listen !== 'boolean'){ action.listen = true }
      if(action.listen){ this.listen({type:action.type,name:key,active:true}) }
    },
    listen: function(action){
      if(typeof action !== 'object' || ( action.type && typeof action.type !== 'string' ) || (action.name && typeof action.name !== 'string') || (action.active && typeof action.active !== 'boolean')){
        throw new Error('The paramter must adhere to the following format --> {type: string, name: string, active: boolean}')
      }
      if(!this.actions[action.type][action.name]){ throw new Error('The action with the following type '+action.type+' and name '+action.name+' could not be found')}
      if(action.active){ this.addEventListener(action.type,this.actions[action.type][action.name]) }
      else if(!action.active){ this.removeEventListener(action.type,this.actions[action.type][action.name]) }
    }
  }
  const ERROR = {view: undefined, list:[], response:{error: false, message: ''} }
  const RULES = {
    available: {
      'text:email': function(input){
        var run = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if(!run.test(String(input.value).toLowerCase())){ this.error = true; this.message = `The email you entered is not a valid format`; }
        return this
      },
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
             query = INPUTS.get(query)
             if(query.length){ query.forEach((input)=>{ inputs.push(input) }) }
             else{ throw new Error('The query at the following index '+i+'was empty')}
           })
        }
        else{
          inputs = INPUTS.get(register.input)
          if(inputs.length === 0){ throw new Error('The input query you provided was empty') }
        }

        inputs.forEach((input)=>{
          register.rules.forEach((rule)=>{ if(input.rules.indexOf(rule) === -1 ){ input.rules.push(rule) } })
        })

      }
      else{
        throw new Error('The paramter must adhere to the following structure --> {input: [] || {type: string} || {name: string} , rules: [function,function,...] }')
      }
    },
    validate: ()=>{
      ERROR.list = []
      INPUTS.get().forEach((input)=>{
        if(input.rules.length){ input.rules.forEach((rule)=>{ rule = RULES.available[rule].call(ERROR.response,input); if(rule.error){ ERROR.list.push({input:input,message:rule.message}) } ERROR.response.error = false; ERROR.response.message = '';  }) }
      })
      return {list: ERROR.list,view: ERROR.view}
    }
  }

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
        execute: (node)=>{ BUTTONS.add(node) }
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

  this.inputs = {
    get: INPUTS.get,
    format: INPUTS.format,
    validate: RULES.validate,
    send: INPUTS.send
  }
  this.rules = {
    register: RULES.register,
    add: RULES.add
  }
  this.buttons = BUTTONS.get

}


export { Form }
