import { Notify } from 'notiflix/build/notiflix-notify-aio';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import { PhotoApi } from './photo-api';

const refs = {
  formEl: document.querySelector('.search-form'),
  gallery: document.querySelector('.gallery'),
  target: document.querySelector('.target'),
};

const photoApi = new PhotoApi();

const options = {
  threshold: 0,
};
const observer = new IntersectionObserver(onLoad, options);

const lightbox = new SimpleLightbox('.gallery a');

refs.formEl.addEventListener('submit', onFindPhoto);

async function onFindPhoto(e) {
  e.preventDefault();

  const searchQuery = e.target.elements.searchQuery.value;

  if (!searchQuery || searchQuery === ' ') {
    Notify.failure('Please enter a search term.');
    return;
  }

  photoApi.q = searchQuery;
  photoApi.page = 1;

  try {
    const data = await photoApi.getPhotos();
    if (data.hits.length === 0) {
      Notify.failure(
        'Sorry, there are no images matching your search query. Please try again.'
      );
      return;
    }
    refs.gallery.innerHTML = '';
    const markup = renderGalleryList(data.hits);
    refs.gallery.insertAdjacentHTML('beforeend', markup);

    Notify.info(`Hooray! We found ${data.totalHits} images.`);

    lightbox.refresh();
    smoothScroll();
    photoApi.totalPage = Math.ceil(data.totalHits / 40);
    observer.observe(refs.target);
    updateStatusObserver();
  } catch (error) {
    console.log(error);
    Notify.failure('Failed to fetch images. Please try again.');
  }
}

function renderGalleryList(hits) {
  const markup = hits.map(galleryTemplate).join('');
  return markup;
}

function galleryTemplate({
  webformatURL,
  largeImageURL,
  tags,
  likes,
  views,
  comments,
  downloads,
}) {
  return `<li class='gallery-item'>
  <div class="photo-card">
  <a class='gallery-link' href='${largeImageURL}'>
        <img src='${webformatURL}' alt='${tags}' loading="lazy" class='gallery-image'>
        </a>
        <div class="info">
          <p class="info-item">
            <b>Likes</b>
            ${likes}
          </p>
          <p class="info-item">
            <b>Views</b>
            ${views}
          </p>
          <p class="info-item">
            <b>Comments</b>
            ${comments}
          </p>
          <p class="info-item">
            <b>Downloads</b>
            ${downloads}
          </p>
          </div>
        </div>
      </li>`;
}
async function onLoad(entries, observer) {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;

    photoApi.page += 1;
    updateStatusObserver();
    try {
      const data = await photoApi.getPhotos();
      const markup = renderGalleryList(data.hits);
      refs.gallery.insertAdjacentHTML('beforeend', markup);
      lightbox.refresh();
      smoothScroll();
    } catch (error) {
      console.log(error);
    }
  }
}

function updateStatusObserver() {
  const isLastPage = photoApi.page >= photoApi.totalPage;
  if (isLastPage) {
    observer.unobserve(refs.target);
    Notify.info("We're sorry, but you've reached the end of search results.");
  }
}
function smoothScroll() {
  const { height: cardHeight } = document
    .querySelector('.gallery')
    .firstElementChild.getBoundingClientRect();

  window.scrollBy({
    top: cardHeight * 2,
    behavior: 'smooth',
  });
}
