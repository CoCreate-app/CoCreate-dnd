 CoCreate.socket.listen('sendMessage', function(data) {
   console.log('aaaa', data)
   // resolving the element_id to real element in the clinet
   data.target = document.querySelector(`[element_id=${data.target}]`);
   data.value[1] = document.querySelector(`[element_id=${data.value[1]}]`);

   // passing it to domEditor
   let [position, el] = data.value
   data.target.insertAdjacentElement(position, el)
   // domEditor(data);
 });
 