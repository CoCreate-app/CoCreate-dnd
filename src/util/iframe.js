// always loaded in host no iframes

window.addEventListener('load', () => {


  let iframes = {
    host: {
      document,
      window
    },
    guests: {}
  };
  window.iframes = iframes


  let allFrames = document.getElementsByTagName('iframe')

  let i = 1;
  for (let frame of allFrames) {
    let id = frame.id || `iframe${i++}`
    iframes.guests[id] = ({
      frame,
      document: frame.contentDocument,
      window: frame.contentWindow
    })
    frame.contentWindow.iframes = iframes;
  }




  const callback = function(mutationsList, observer) {

    for (let mutation of mutationsList) {
      if (mutation.type === 'childList') {
        for (let added of mutation.addedNodes) {
          if (added.tagName === 'IFRAME') {
            let id = added.id || `iframe${i++}`
            iframes.guests[id] = ({
              frame: added,
              document: added.contentDocument,
              window: added.contentWindow
            })
            added.contentWindow.iframes = iframes;
          }
        }
      }

    }
  };

  const observer = new MutationObserver(callback);

  const config = { attributes: true, childList: true, subtree: true };

  observer.observe(document.body, config);


})
