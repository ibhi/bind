function Bind(data, mapping) {
  // Utility methods
  const $ = document.querySelectorAll.bind(document);
  const isObject = obj => obj && typeof obj === 'object'; //Is Object as well as Array
  const hasKey = (obj, key) => key in obj;
  const isString = str => str && typeof str === 'string';
  const isFunction = func => func && typeof func === 'function';
  const isArray = array => Array.isArray(array);
  const getKey = (key) => {
    var intKey = parseInt(key);
    if (intKey.toString() === key) {
      return intKey;
    }
    return key;
  };
  const getShallowProperty = (obj, prop) => {
    if ((typeof prop === 'number' && Array.isArray(obj)) || hasKey(obj, prop)) {
      return obj[prop];
    }
  };

  function tryit(fn) {
    return function(val) {
      try {
        return fn.apply(this, arguments);
      } catch (e) {
        console.error(e.stack ? e.stack : e);
      }
    };
  };

  const safe = str => {
    return (str + '').replace(/[<>]/g, function (m) {
      return {
        '>': '&gt;',
        '<': '&lt;',
      }[m];
    });
  };

  // Returns relative path of a key in the obj
  // let obj = {name: {lastName: 'Doe'}} 
  // relativePath(obj, 'lastName') => 'name.lastName'
  const relativePath = (obj, prop) => {
    let path = '';
    if(hasKey(obj, prop)) {
      path += prop;
      return path;
    }
    
    for (let key in obj) {
      if(obj.hasOwnProperty(key)) {
        if(typeof obj[key] === 'object') {
          let foundKey = relativePath(obj[key], prop);
          if(foundKey) {
            if(foundKey.length > 0) {
              path += key;
              path += '.';
              path += foundKey;
              return path;
            }
          }
        }
      }
    }
  };

  const objectPath = {
    get: (obj, path) => {
      if (typeof path === 'number') {
        path = [path];
      }
      if (!path || path.length === 0) {
        return obj;
      }
      if (obj == null) {
        return undefined;
      }
      if (typeof path === 'string') {
        return objectPath.get(obj, path.split('.'));
      }

      var currentPath = getKey(path[0]);
      var nextObj = getShallowProperty(obj, currentPath);
      if (nextObj === void 0) {
        return undefined;
      }

      if (path.length === 1) {
        return nextObj;
      }

      return objectPath.get(obj[currentPath], path.slice(1));
    }
  };
  

  // Proxying the provided data object (including nested objects)
  const proxify = (obj) => {
    const handler = {
      get: (target, prop) => {
        if (hasKey(obj, prop)) {
          let value = obj[prop];
          console.log('Getter ', target, prop);
          if (isObject(value)) {
            return proxify(value);
          }
          // if(isFunction(value)) {
          //   return value.bind(obj);
          // } else if (isObject(value)) {
          //   return proxify(value);
          // } else if(value) {
          //   return value;
          // }
        }
        return undefined;
      },
      set: (target, prop, newVal) => {
        obj[prop] = newVal;
        console.log('Setter ', target, prop, newVal);
        let propPath = relativePath(data, prop);
        if (hasKey(mapping, propPath)) {
          update(propPath, newVal);
        }
        return true;
      },
      deleteProperty: (target, prop) => {
        deleteProperty(prop);
        return true;
      }
    };
    return new Proxy(obj, handler);
  };

  function init() {
    Object.keys(mapping).forEach(function(key) {
      if(hasKey(data, key)) {
        update(key, data[key]);
      }
    });
  }
  // Initial render
  // init();
  
  function update(prop, newVal) {
    const render = (elements, innerHtml) => {
      if(elements) {
        elements.forEach((element) => {
          element.innerHTML = innerHtml;
        });
      }
    };
    let elements = [];
    let value = mapping[prop];
    // if the set prop is of type string, then it is an query selector string
    if (isString(value)) {
      elements = $(value);

      render(elements, safe(newVal));
      return;

    }
    // if the set prop is of type function, then it is an listener function and we have to call it
    if (isFunction(value)) {
      value.call(data, newVal);
      return;
    }

    if (value && value.toString() === '[object Object]') {
      let innerHtml = newVal;

      if (value.dom) {
        if(value.callback) {
          // console.log('Callback new value ', newVal);
          value.callback.call(data, newVal);
        }
        if (value.transform) {
          // console.log('Transfor ++', newVal);
          if(isArray(newVal)) {
            innerHtml = '';
            newVal.forEach((item) => {
              innerHtml += tryit(value.transform.bind({ safe: safe }))(item);
            });
          } else {
            innerHtml = tryit(value.transform.bind({ safe: safe }))(newVal);
          }
        }
        elements = $(value.dom);
        if(innerHtml) {
          render(elements, innerHtml);
        }
      }
      return;
    }
      
  }

  const deleteProperty = (prop) => {
    let propPath = relativePath(data, prop);
    let elements;
    let value = mapping[propPath];
    if(hasKey(mapping, propPath)) {
      if(isString(value)) {
        elements = $(value);
      } else if(isObject(value) && !isArray((value))) {
        elements = $(value.dom);
      }
      if(elements) {
        elements.forEach(element => {
          element.parentElement.removeChild(element);
        });
      }
    }
  };
  return proxify(data);
}



// Test code
let data = {
  firstName: 'John', 
  lastName: 'Doe',
  name: {
    middleName: 'test'
  },
  address: {
    city: 'Chennai',
    pinCode: 4320,
    country: {
      code: 'IN',
      codes: ['IN', 'USA']
    }
  }
};

let mapping = {
  firstName: '#first-name',
  lastName: function(lastName) {
    console.log('Callback: My firstname is '+ this.firstName + ' and last name is ' + lastName);
  },
  'address.city': '#city',
  'address.country.code': function(country) {
    // console.log('Callback: My country code is '+ country);
  },
  // 'address.country.codes.0': function(code) {
  //   console.log('Callback: My country code is '+ code);
  // },
  'name.middleName': {
    dom: '.middle-name',
    transform: function(value) {
      console.log('Transform ', value, this);
      return '<div><b>' + this.safe(value) + '</b></div>';
    },
    callback: function(value) {
      console.log('Callback for middlename ' + value + ' and first name is ' + this.firstName);
    }
  },
  'address.country.codes': {
    dom: '#codes',
    transform: function(code) {
      return '<li>' + this.safe(code) + '</li>';
    }
  }
};

let user = Bind(data, mapping);

// user.address.street = '20';
user.name.middleName = 'Robert';
setTimeout(function() {
  user.firstName = 'Jane';
  user.lastName = 'Smith';
  user.address.city = 'Mumbai';
  user.address.pinCode = 5000;
  user.address.country.code = 'UK';
  user.address.country.codes = ['EU', 'USA'];
  
  user.age = 30;
  user.foo = {
    bar: 'baz'
  };
  data.firstName = 'Jane';
  delete user.name.middleName;
  

}, 5000);

// console.log(user.address.street, user.firstName);

// const relativePath = (obj, prop) => {
//   let path='';
//   if(prop in obj) {
//     path += prop;
//     return path;
//   }
  
//   for (let key in obj) {
//     if(obj.hasOwnProperty(key)) {
//       if(typeof obj[key] === 'object') {
//         let foundKey = relativePath(obj[key], prop);
//         if(foundKey) {
//           if(foundKey.length > 0) {
//             path += key;
//             path += '.'
//             path += foundKey;
//             return path;
//           }
//         }
//       }
//     }
//   }
// };
