import { Form } from './Forms.js'


document.addEventListener('DOMContentLoaded',function(e){
  let signup = new Form('signUp');
  signup.rules.add({name:'email'})

})

export { signup }
