const { ipcRenderer } = require('electron');

let selectedBook = '';
let selectedAuthor = '';

ipcRenderer.on('book-selected', (event, book, author) => {
  selectedBook = book;
  selectedAuthor = author;
  document.getElementById('title').textContent = `Add ${book} by ${author} to read list.`;
});

function addLocalStorage(book) {
  const existingData = localStorage.getItem('readlist');
  const savedData = existingData === null ? [] : JSON.parse(existingData);
  const readlist = Array.isArray(savedData)
    ? savedData
    : savedData && typeof savedData === 'object'
      ? [savedData]
      : [];

  readlist.push(book);

  localStorage.setItem('readlist', JSON.stringify(readlist));
}


document.getElementById('saveBtn').addEventListener('click', () => {
  const note = document.getElementById('note').value.trim();

  // Create JavaScript Object
  const bookToRead = {
    book: selectedBook,
    author: selectedAuthor,
    note: note
  };

  try {
    // Store JSON in LocalStorage
    addLocalStorage(bookToRead);
    alert('Book saved to read list!');

    // Store in JSON file
    ipcRenderer.send('save-book', bookToRead);
  }
  catch (error) {
    alert('Failed to save book to read list. Please try again.');
  }
  
});
