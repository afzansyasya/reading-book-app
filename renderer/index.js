const { ipcRenderer } = require('electron');
const searchBtn = document.getElementById('searchBtn');
const resultDiv = document.getElementById('result');
const listBtn = document.getElementById('listBtn');
const recommendationsDiv = document.getElementById('recommendations');
const readListBooks = document.getElementById('readListBooks');

let currentBook = '';
let currentAuthor = '';

searchBtn.addEventListener('click', async () => {
  const title = document.getElementById('bookTitle').value.trim();
  if (!title) return alert('Please enter book title.');

  currentBook = '';
  currentAuthor = '';

  try {
    const SearchUrl = new URL(`https://openlibrary.org/search.json`);
    SearchUrl.searchParams.set('q', title);
    SearchUrl.searchParams.set('limit', '1');
    listBtn.style.display = 'none';

    const response = await fetch(SearchUrl);
    const SearchData = await response.json();
    const searchResult = Array.isArray(SearchData.docs) ? SearchData.docs[0] : null;
    if(!searchResult) throw new Error('No results found');

    const bookResponse = await fetch(`https://openlibrary.org${searchResult.key}.json`);
    const bookData = await bookResponse.json();
    if (!bookData) throw new Error('Book not found');

    currentBook = bookData.title;
    
    const description = bookData.description;
    const summary = typeof description === 'string'
      ? description
      : description?.value || 'No summary available.';

    resultDiv.innerHTML = `
      <h2>${bookData.title}</h2>
      <p>by ${searchResult.author_name}</p>
      <p>${summary}</p>
    `;

    listBtn.style.display = 'block';
    
    currentAuthor = searchResult.author_name;
    if (!currentAuthor) {
          recommendationsDiv.innerHTML = `<p style="color:red;">No recommendations available.</p>`;
    }

    else{ // Suggest books based on author      
      const authorUrl = new URL(`https://openlibrary.org/search.json`);
      authorUrl.searchParams.set('author', currentAuthor);
      const authorResponse = await fetch(authorUrl);

      const recommendData = await authorResponse.json();
      const books = Array.isArray(recommendData.docs) ? recommendData.docs : [];

      // Total borrowable E-Books by the same author
      let totalBorrowable = 0;
      for (let i = 0; i < books.length; i++) {
        if (books[i].ebook_access === 'borrowable') {
          totalBorrowable++;
        }
      }

      const recommendations = (recommendData.docs || []).filter(item => item.key !== searchResult.key).slice(0, 3);
      recommendationsDiv.innerHTML = `
      <h2>Total borrowable E-Books by ${currentAuthor}: ${totalBorrowable}</h2>  
      <h2>Recommended books by ${currentAuthor}:</h2>`;

      for (let i = 0; i < recommendations.length; i++) {
        const recommendation = recommendations[i];
        const recResponse = await fetch(`https://openlibrary.org${recommendation.key}.json`);
        
        const recData = await recResponse.json();
        const summary = typeof recData.description === 'string'
          ? recData.description
          : recData.description?.value || 'No summary available.';

        recommendationsDiv.innerHTML += `
          <h3>${i + 1}. ${recommendation.title}</h3>
          <p>${summary}</p>`;
      }
    };

  } catch (error) {
    resultDiv.innerHTML = `<p style="color:red;">Error fetching book data.</p>`;
    listBtn.style.display = 'none';
  }});
  
  listBtn.addEventListener('click', () => {
    ipcRenderer.send('open-book-window', currentBook, currentAuthor);
});


// Adding CRUD for local storage for read listt

function getReadList() {
  return JSON.parse(localStorage.getItem('readlist') || '[]');
}

function saveReadList(books) {
  localStorage.setItem('readlist', JSON.stringify(books));
}

function showReadList() {
  const books = getReadList();
  readListBooks.replaceChildren();

  if (books.length === 0) {
    readListBooks.innerHTML = '<h3>Read list is empty.</h3>';
    return;
  }

  books.forEach((book, index) => {
    const item = document.createElement('p');
    item.innerHTML = `<b>${book.book}</b> by ${book.author} — ${book.note || '-'}`;

    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    editButton.onclick = () => {
      const note = document.createElement('input');
      note.value = book.note || '';

      const saveButton = document.createElement('button');
      saveButton.textContent = 'Save';
      saveButton.onclick = () => {
        books[index].note = note.value;
        saveReadList(books);
        showReadList();
      };

      const cancelButton = document.createElement('button');
      cancelButton.textContent = 'Cancel';
      cancelButton.onclick = () => showReadList();

      item.replaceChildren(item.firstChild, note, saveButton, cancelButton);

      note.focus();
    };

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.onclick = () => {
      books.splice(index, 1);
      saveReadList(books);
      showReadList();
    };

    item.append(editButton, deleteButton);
    readListBooks.append(item);
  });
}

showReadList();

window.addEventListener('focus', showReadList);