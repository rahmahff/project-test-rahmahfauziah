const API_BASE_URL = 'https://suitmedia-backend.suitdev.com/api/ideas';
const header = document.querySelector('.header');
const heroImage = document.getElementById('heroImage');
const articleContainer = document.getElementById('articleContainer');
const pageNavigation = document.getElementById('pageNavigation');
const showPerPageSelect = document.getElementById('showPerPage');
const sortBySelect = document.getElementById('sortBy');
const showingItemsText = document.getElementById('showingItemsText');
const dataloadSpinner = document.getElementById('dataloadSpinner');

let lastScrollTop = 0;
let currentPage = 1;
let itemsPerPage = parseInt(showPerPageSelect.value);
let sortBy = sortBySelect.value;
let totalItems = 0; 

// --- Untuk Scroll Header ---
window.addEventListener('scroll', () => {
    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // Menyembunyikan/menampilkan header
    if (currentScrollTop > lastScrollTop) {
        header.classList.add('hidden');
    } else {
        header.classList.remove('hidden');

        // Menerapkan transparanT berdasarkan scroll
        if (currentScrollTop > 0) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
    lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop; 
});

// --- Parallax di Banner ---
window.addEventListener('scroll', () => {
    const scrollPosition = window.pageYOffset;
    heroImage.style.transform = `translateY(${scrollPosition * 0.3}px)`;
});

// --- Fungsi Fetch Posts ---
async function fetchPosts() {
    dataloadSpinner.style.display = 'flex'; 
    articleContainer.innerHTML = ''; 

    const params = new URLSearchParams({
        'page[number]': currentPage,
        'page[size]': itemsPerPage,
        'append[]': 'small_image',
        'append[]': 'medium_image',
        'sort': sortBy
    });

    const apiUrl = `${API_BASE_URL}?${params.toString()}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'GET', 
            headers: {
                'Content-Type': 'application/json', 
                'Accept': 'application/json' 
            }
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || 'Unknown error'}`);
        }
        const data = await response.json();
        totalItems = data.meta.total; 

        renderPosts(data.data);
        renderPagination(data.meta.last_page);
        updateShowingItemsText();
        saveStateToLocalStorage(); 
    } catch (error) {
        console.error("Error fetching posts:", error);
        articleContainer.innerHTML = `<div class="col-12 text-center text-danger">Failed to load posts. Please try again later. ${error.message ? `(${error.message})` : ''}</div>`;
    } finally {
        dataloadSpinner.style.display = 'none'; 
    }
}

// --- Fungsi Render Posts ---
function renderPosts(posts) {
    articleContainer.innerHTML = ''; 
    if (posts.length === 0) {
        articleContainer.innerHTML = `<div class="col-12 text-center">No posts found.</div>`;
        return;
    }

    posts.forEach(post => {
        const imageUrl = post.small_image?.[0]?.url || post.medium_image?.[0]?.url || `https://placehold.co/400x200/cccccc`;
        const title = post.title || 'No Title';
        const publishedAt = post.published_at ? (() => {
            const dateObj = new Date(post.published_at);
            const day = dateObj.getDate();
            const month = dateObj.toLocaleString('id-ID', { month: 'long' }).toUpperCase(); 
            const year = dateObj.getFullYear();
            return `${day} ${month} ${year}`;
        })() : 'Unknown Date';

        const postCard = `
            <div class="col">
                <div class="card card-article">
                    <img src="${imageUrl}" class="card-article-img-top" alt="${title}" loading="lazy">
                    <div class="card-body">
                        <p class="card-text"><small class="text-muted">${publishedAt}</small></p> <!-- Moved date above title -->
                        <h5 class="card-title">${title}</h5>
                    </div>
                </div>
            </div>
        `;
        articleContainer.innerHTML += postCard;
    });
}

// --- Fungsi Render Pagination ---
function renderPagination(lastPage) {
    console.log("renderPagination() called. Last page:", lastPage); // Debug log
    if (pageNavigation) pageNavigation.innerHTML = ''; 

    // Tombol kembali (halaman pertama)
    if (pageNavigation) pageNavigation.innerHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="1" aria-label="First">
                <span aria-hidden="true">&laquo;&laquo;</span>
            </a>
        </li>
    `;

    // Tombol sebelumnya
    if (pageNavigation) pageNavigation.innerHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage - 1}" aria-label="Previous">
                <span aria-hidden="true">&laquo;</span>
            </a>
        </li>
    `;

    // Nomor halaman 
    let pagesToShow = [];
    const pagesPerBlock = 4; 

    // Menghitung halaman awal blok
    const startBlockPage = ((Math.ceil(currentPage / pagesPerBlock) - 1) * pagesPerBlock) + 1;
    
    // Menampilkan halaman dalam blok
    for (let i = 0; i < pagesPerBlock; i++) {
        const pageNum = startBlockPage + i;
        if (pageNum <= lastPage) { 
            pagesToShow.push(pageNum);
        }
    }

    pagesToShow.forEach(page => {
        if (pageNavigation) pageNavigation.innerHTML += `
            <li class="page-item ${currentPage === page ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${page}">${page}</a>
            </li>
        `;
    });

    // Tombol berikutnya
    if (pageNavigation) pageNavigation.innerHTML += `
        <li class="page-item ${currentPage === lastPage ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage + 1}" aria-label="Next">
                <span aria-hidden="true">&raquo;</span>
            </a>
        </li>
    `;

    // Tombol berikutnya (halaman terakhir)
    if (pageNavigation) pageNavigation.innerHTML += `
        <li class="page-item ${currentPage === lastPage ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${lastPage}" aria-label="Last">
                <span aria-hidden="true">&raquo;&raquo;</span>
            </a>
        </li>
    `;

    // Event listeners untuk pagination
    if (pageNavigation) { 
        pageNavigation.querySelectorAll('.page-link').forEach(link => { 
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                if (!isNaN(page) && page !== currentPage && page > 0 && page <= lastPage) {
                    currentPage = page;
                    fetchPosts();
                }
            });
        });
    }
}

// --- Perbarui Menampilkan Item ---
function updateShowingItemsText() {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    showingItemsText.textContent = `Showing ${startItem} - ${endItem} of ${totalItems}`;
}

// --- Event Listeners untuk Filters ---
showPerPageSelect.addEventListener('change', () => {
    itemsPerPage = parseInt(showPerPageSelect.value);
    currentPage = 1; 
    fetchPosts();
});

sortBySelect.addEventListener('change', () => {
    sortBy = sortBySelect.value;
    currentPage = 1; 
    fetchPosts();
});

// --- Save and Load dari Penyimpanan Lokal ---
function saveStateToLocalStorage() {
    const state = {
        currentPage: currentPage,
        itemsPerPage: itemsPerPage,
        sortBy: sortBy
    };
    localStorage.setItem('ideasAppState', JSON.stringify(state));
}

function loadStateFromLocalStorage() {
    const savedState = localStorage.getItem('ideasAppState');
    if (savedState) {
        const state = JSON.parse(savedState);
        currentPage = state.currentPage || 1;
        itemsPerPage = state.itemsPerPage || 10;
        sortBy = state.sortBy || '-published_at';

        showPerPageSelect.value = itemsPerPage;
        sortBySelect.value = sortBy;
    }
}

// --- Load Awal ---
document.addEventListener('DOMContentLoaded', () => {
    loadStateFromLocalStorage(); 
    fetchPosts();
});
