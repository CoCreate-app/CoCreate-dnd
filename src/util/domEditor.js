 //Insert general attributtes and classes in elements
 // domEditor[
 //     either target or selector_type and selector should be defined
 //     target: 'object',
 //         // containing both selector_type and selector
 //     selector_type: 'querySelectorAll',
 //         //querySelectorAll, querySelector, getElementById, getElementsByClassName
 //     selector: '*',
 //         //#id,.Class, tagname,;
 //     method: 'setAttribute',
 //         //classList, classList.remove, classList.replace,  style, attribute, getAttribute, removeAttribute, setAttribute, attribute, insertAdjacentElement
 //     index : null,
 //         // [n], null
 //     property : null,
 //         //null,length,color,
 //     value : '{‘first_attr’:’cvalue’,’second_attr’:’value’}',
 //         //“hola, hey” ; “hola”, “hey”;  “string”; {‘first_attr’:’cvalue’,’second_attr’:’value’},  ['positon', 'value']
 // if you give an array it is going to invoke method for every element in the array
 // ]


 function domEditor({ target, selector_type, selector, method, index, property, sub_property, value, mutliValue }) {


  if (!target) {
   if (!document[selector_type])
    throw new Error('selector type not supported.')

   let target = document[selector_type](selector);

   if (!target)
    return null;
  }

  if (index && target[index])
   target = target[index];


  if (!method)
   return target;

  let targets = (target.length > 0) ? target : [target];

  let results = [];
  let element;
  targets.forEach(target => {
   let result = apply_method({ target, method, property, value })
   if (result)
    results.push(result);
   else
    element = target[method]

  })
  if (element) return element;
  return results;
 }


 function apply_method({ target, method, property, value, mutliValue }) {
  let results = [];

  if (typeof value == 'string')
   value = [value];

  if (method == 'style')
   if (value) {
    target[method][property] = value;
    return;
   }
  else {
   return target[method][property];
  }

  let querySection = method.split(".");
  let func = querySection.reduce((a, c) => a[c], target);
  let lastEl = querySection.pop();
  let env = querySection.reduce((a, c) => a[c], target);

  if (typeof env[lastEl] != 'function')
   if (value) {
    env[lastEl] = value;
    return;
   }
  else {
   return env[lastEl];
  }


  if (!value && typeof env[lastEl] == 'function')
   env[lastEl]();


  if (Array.isArray(value)) {
   let result = func.apply(env, value)
   results.push(result)
  }
  else if (typeof value == 'object') {
   Object.entries(value).forEach((e) => {
    let result = func.apply(env, e)
    results.push(result)
   });
  }
  return results;
 }
 