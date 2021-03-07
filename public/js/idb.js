// create variable to hold db connection
let db;
// establish connection to IndexedDB and set name and version numbers
const request = indexedDB.open('budget', 1);

// this event will emit if the database version changes
request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('new_budgetTransaction', { autoIncrement: true });
};

// upon successful
request.onsuccess = function(event) {
    db = event.target.result;
    if (navigator.onLine) {
        sendTransaction();
    }
};

request.onerror = function(event) {
    console.log(event.target.errorCode);
};

// function to save the budget transaction if there is no internet access
function saveRecord(transaction) {
    // this is for opening the IndexedDB transaction to enter our budget transaction
    const record = db.transaction(['new_budgetTransaction'], 'readwrite');

    const budgetTransactionObjectStore = record.objectStore('new_budgetTransaction');

    budgetTransactionObjectStore.add(transaction);
};

function uploadTransaction() {
    const record = db.transaction(['new_budgetTransaction'], 'readwrite');

    const budgetTransactionObjectStore = record.objectStore('new_budgetTransaction');

    const getAll = budgetTransactionObjectStore.getAll();

    getAll.onsuccess = function() {
        // if data in indexedDB store, send to api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain. */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    // open one more record
                    const record = db.transaction(['new_budgetTransaction'], 'readwrite');

                    const budgetTransactionObjectStore = record.objectStore('new_budgetTransaction');

                    budgetTransactionObjectStore.clear();

                    alert('All saved transactions have been submitted!');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    };
}

// listen for app coming back online
window.addEventListener('online', uploadTransaction);