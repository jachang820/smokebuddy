/* List all elements of a model. */
window.addEventListener('load', function() {

  let tbody = document.getElementById('list-body');
  const model = document.getElementById('model-name').textContent;
  let page = parseInt(
      document.getElementById('page-input').value);

  /* Create object representing one existing line. */
  const getItem = function(row) {
    let line = {};
    for (let j = 2; j < row.children.length; j++) {
      const field = row.children[j].className.split(' ')[0];
      line[field] = row.children[j].textContent.trim();
    }
    
    return line;
  };

  /* Create object representing newly entered line. */
  const getNewItem = function(row) {
    let line = {};
    for (let j = 2; j < row.children.length; j++) {
      const field = row.children[j].className.split(' ')[0];
      const inData = row.children[j].firstElementChild;

      switch(inData.tagName.toLowerCase()) {
        case 'input':
          line[field] = inData.value;
          break;
        case 'select':
          const index = inData.selectedIndex;
          if (index < 0) {
            line[field] = "";
          } else {
            line[field] = inData.options[index].value;
          }
      }
    }
    return line;
  };

  const getId = function(row) {
    let classes = row.className.split(' ');
    if (classes.length === 2 && classes[1].startsWith('id')) {
      return classes[1].substring(3);
    } else {
      return window.location.replace('/error/500');
    }
  };

  /* Remove all children nodes. */
  const empty = function(root) {
    while (root.firstChild) {
      root.removeChild(root.firstChild);
    }
  };

  /* Propagate errors to a cell. */
  const appendErrors = function(col, errors) {
    /* Empty the corresponding error list. */
    let errList = col.getElementsByTagName('ul')[0];
    empty(errList);

    /* Find relevant errors and add to cell. */
    let field = col.className.split(' ')[0];
    for (let k = 0; k < errors.length; k++) {
      if (errors[k].param == field) {
        let li = document.createElement('li');
        li.textContent = errors[k].msg;
        errList.appendChild(li);
      }
    }
  };

  /* Add errors to each column. */
  const appendErrorsForEach = function(errors, row) {
    for (let j = 2; j < row.children.length; j++) {
      let td = row.children[j];
      appendErrors(td, errors);
    }
  };

  const buildQueryString = function(instructions) {
    let query = [];
    let dirIcon = document.getElementsByClassName('asc')[0] ||
                  document.getElementsByClassName('desc')[0];

    if (instructions.desc !== 'default') {
      if ('sort' in instructions) {
        query.push('sort=' + instructions.sort);
      
      } else if (dirIcon) {
        let th = dirIcon.parentNode.parentNode;
        query.push('sort=' + th.className);
      }

      if ('desc' in instructions) {
        query.push('desc=' + instructions.desc);  
        
      } else if (dirIcon) {
        if (dirIcon.className === 'desc') {
          query.push('desc=true');
        } else {
          query.push('desc=false');
        }
      }
    }

    if ('page' in instructions) {
      if (instructions.page === "+") {
        query.push('page=' + (page + 1));
      } else if (instructions.page === "-") {
        query.push('page=' + (page - 1));
      } else {
        query.push('page=' + instructions.page);
      }
    } else {
      query.push('page=' + page);
    }

    return '?' + query.join('&');
  };

  /* Function attached to new line item event listener. */
  const createEvent = function(event) {
    let row = event.currentTarget.parentNode.parentNode;
    let line = getNewItem(row);

    axios.post('/' + model, line).then(function(response) {
      /* Errors found. Append errors to respective cell. */
      if (response.data.errors) {

        if (response.data.errors === 'unknown') {
          window.location.replace('/error/500');
        }

        const errors = response.data.errors;
        appendErrorsForEach(errors, row);
      
      } else {
        /* No errors. Add line. */  
        window.location.replace('/' + model);
      }

    }).catch(function(err) {
      console.log(err);
    });
  };

  /* Function attached to existing line action event listener. */
  const statusEvent = function(event) {
    const row = event.currentTarget.parentNode.parentNode;
    const id = getId(row);

    /* Update line status, move to appropriate place in table. */
    const path = '/' + model + '/' + id;
    axios.put(path).then(function(response) {

      if (response.data.errors) {

        if (response.data.errors === 'unknown') {
          window.location.replace('/error/500');
        }

        const errors = response.data.errors;
        appendErrorsForEach(errors, row);
      
      } else {
        /* No errors. Add line. */  
        window.location.replace('/' + model);
      }

    }).catch(function(err) {
      console.log(err);
    });
  };

  const arrivalEvent = function(event) {
    const row = event.currentTarget.parentNode.parentNode;
    const id = getId(row);

    /* Update line status, move to appropriate place in table. */
    const path = '/' + model + '/stock/' + id;
    axios.put(path).then(function(response) {

      if (response.data.errors) {

        if (response.data.errors === 'unknown') {
          window.location.replace('/error/500');
        }

        const errors = response.data.errors;
        appendErrorsForEach(errors, row);
      
      } else {
        /* No errors. Add line. */  
        window.location.replace('/' + model);
      }

    }).catch(function(err) {
      console.log(err);
    });
  };

  const expandEvent = function(event) {
    let button = event.currentTarget;
    let tr = button.parentNode.parentNode;
    let detailsRow = tr.nextElementSibling;
    let classes = detailsRow.className.split(' ');

    if (classes.length === 3) { // visible
      button.src = '/images/expand.png';
      classes.pop();
      detailsRow.className = classes.join(' ');
      return;
    }

    const id = getId(tr);
    const path = '/' + model + '/details/' + id;
    axios.get(path).then(function(response) {

      if (response.data.errors) {

        if (response.data.errors === 'unknown') {
          window.location.replace('/error/500');
        }

        const errors = response.data.errors;
        appendErrorsForEach(errors, row);
      
      } else {
        /* No errors. Show details. */  
        button.src = '/images/minimize.png';
        classes.push('show');
        detailsRow.className = classes.join(' ');
        let div = detailsRow.firstElementChild;
        let data = response.data.details;
        
        let table = document.createElement('table');
        let thead = document.createElement('thead');
        let tr = document.createElement('tr');
        let titles = Object.keys(data[0])

        for (let j = 0; j < titles.length; j++) {
          let th = document.createElement('th');
          let title = document.createTextNode(titles[j]);
          th.appendChild(title);
          tr.appendChild(th);
        }
        thead.appendChild(tr);
        table.appendChild(thead);

        let tbody = document.createElement('tbody');
        for (let i = 0; i < data.length; i++) {
          tr = document.createElement('tr');
          console.log(data[i]);
          for (let j = 0; j < titles.length; j++) {
            let td = document.createElement('td');
            let text = document.createTextNode(data[i][titles[j]]);
            td.appendChild(text);
            tr.appendChild(td);
          }
          tbody.appendChild(tr);
        }
        table.appendChild(tbody);
        
        div.appendChild(table);
      }

    }).catch(function(err) {
      console.log(err);
    });
  };

  const sortEvent = function(event) {
    const link = event.currentTarget;
    let sort = link.parentNode.className;
    const dir = link.firstElementChild.className;
    let desc;
    if (dir === 'none') desc = "false";
    else if (dir === 'asc') desc = "true";
    else if (dir === 'desc') desc = "default";

    let instructions = {};
    if (sort) instructions.sort = sort;
    if (desc) instructions.desc = desc;
    const path = '/' + model + buildQueryString(instructions);
    return window.location.replace(path);
  };

  const showWaitMessage = function(event) {
    let bar = document.getElementById('message-bar');
    bar.style.visibility = 'visible';
    setTimeout(function() {
      bar.style.visibility = 'hidden';
    }, 6000);
  };

  const addActions = function(actionClass, eventFun, startVal = 0) {
    let actions = document.getElementsByClassName(actionClass);
    for (let i = startVal; i < actions.length; i++) {
      actions[i].addEventListener('click', eventFun);
    }
  };

  /* Register event to each row representing existing line items. */
  const tr = tbody.firstElementChild;
  if (tr) {
    const td = tr.firstElementChild;
    let startVal = 0;
    if (td.className.split(' ')[1] === 'add') {
      /* POST to create new. */
      let newAction = document.getElementsByClassName('action-icon')[0];
      newAction.addEventListener('click', createEvent);
      startVal = 1;
    }
    addActions('action-icon', statusEvent, startVal);
    addActions('print-qr', showWaitMessage);
    addActions('expand', expandEvent);
    addActions('stock', arrivalEvent);
    addActions('sort-link', sortEvent);
  }

  const priorUrl = '/' + model + buildQueryString({ page: "-" });
  const afterUrl = '/' + model + buildQueryString({ page: "+" });

  let priorPage = document.getElementById('prior-page');
  if (priorPage) priorPage.href = priorUrl;
  let afterPage = document.getElementById('after-page');
  if (afterPage) afterPage.href = afterUrl;

  let pageButton = document.getElementById('page-button');
  pageButton.addEventListener('click', function(event) {
    let page = document.getElementById('page-input').value;
    return window.location.replace(
      '/' + model + buildQueryString({ page: parseInt(page) })
    );
  });

});