window.CoCreateDnd.initIframe({ document, window });
window.CoCreateDnd.initFunction({
    target: document.getElementById('onConditionDnd'),
     onDnd:(element, request)=>{    
       return [element, request[0]]
    },

  });
