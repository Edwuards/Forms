function Form(id){
  let form = typeof id === 'string' ? document.querySelector(`form[data-id="${id}"]`) : new Error('The id paramter must be a valid string');
  if(form.constructor.name === 'Error'){ throw form }
  else if(form === undefined || form === null){ throw new Error(`The form with the following attriubte was not found --> data-id="${id}"`) }
  else if( form.children.length === 0 ){ throw new Error('The following Form does is empty not containing buttons or inputs')}
  const INPUTS = []
  const BUTTONS = []
  let COPY = []
  let ERROR = undefined

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
        condition: (node)=>{ return (node.attributes['data'] && node.attributes['data'].value === 'error') },
        execute: (node)=>{ ERROR = node }
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


  this.collect = (where)=>{
    COPY = []
    let push = (input)=>{
      if(input.type !== 'radio' || input.type !== 'checkbox'){
        COPY.push(input)
      }
      else if( input.attributes['checked'] ){ COPY.push(input) }
    }
    let collect = (condition)=>{
      if(condition){ return (input)=>{ if(condition(input)){ push(input) } } }
      else{ return push }
    }
    if(typeof where === 'object' && (typeof where.type === 'string' || typeof where.name === 'string')){
      if(where.type && where.name ){ collect = collect((input)=>{ return where.type === input.type && where.name === input.name }) }
      else if(where.type){ collect = collect((input)=>{ return where.type === input.type }) }
      else if(where.name){ collect = collect((input)=>{ return where.name === input.name  }) }
    }else{ collect = collect()}
    INPUTS.forEach(collect)
    return COPY
  }

  this.validate = (data,rules)=>{
    let errors = [], input = undefined, progress = data.length

    while(progress){
      input = data[progress - 1]
      rules.forEach((rule)=>{
        let test = rule(input)
        if(test.error){ errors.push({input: input, message: test.message }) }
      })
      progress--;
    }
    return errors
  }

  this.send = function(request){
    if(typeof url !== 'string'){ throw new Error('The url parameter must be of a string') }
    if(data === undefined){
      let inputs = this.collect()
      let data = new FormData();
      inputs.forEach((input)=>{
        if(input.type === 'file'){
          data.append(input.name,input.files[0])
        }
        else{
          data.append(input.name,input.value)
        }
      })
    }
    if(typeof request !== 'object'){
      throw new Error('the request paramter must be a valid object')
    }
    if(request === undefined){

    }
    return fetch(url,{
      method: 'POST',
      body: data,
      credentials: 'include'
    })

  }

}


export { Form }
