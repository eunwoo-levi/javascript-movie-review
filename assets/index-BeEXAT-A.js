(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const CustomButton = ({ title, className = "" }) => {
  const customButton = document.createElement("button");
  customButton.className = `primary detail ${className}`;
  customButton.textContent = title;
  return customButton;
};
const ErrorPage = (errorMessage) => {
  const errorPageContainer = document.createElement("div");
  errorPageContainer.className = "error-page-container";
  errorPageContainer.innerHTML = /*html*/
  `
      <img src="./images/으아아행성이.png" alt="error-page-image" class="error-page-image" />
      <h1>오류가 발생했습니다.</h1>
      <p>${errorMessage}</p>
      ${CustomButton({
    title: "홈으로 돌아가기",
    className: "error-page-button"
  }).outerHTML}
  `;
  const errorPageButton = errorPageContainer.querySelector(".error-page-button");
  errorPageButton.addEventListener("click", () => {
    window.location.replace("/");
  });
  return errorPageContainer;
};
const apiClient = async (method, endPoint, headers = {}) => {
  const API_URL = `https://api.themoviedb.org/3${endPoint}`;
  const options = {
    method,
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${"eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0ODM5YTA0NWE3ZWE2MmZiMzgyZjk0YjYzMjNiZmNiOCIsIm5iZiI6MTcxNTYwOTMzMi40NTUwMDAyLCJzdWIiOiI2NjQyMWVmNGJjZDQ0ZmM3Mjg0ZTNkYTEiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.oM6bJmAtSFwD2uePCLydHQhaSgYv1H3eWtxaJF2hfW0"}`,
      ...headers
    }
  };
  const response = await fetch(API_URL, options);
  if (!response.ok) {
    throw new Error("Failed to fetch movie list");
  }
  return response.json();
};
const getMovieList = async ({
  page
}) => {
  try {
    return await apiClient("GET", `/tv/popular?page=${page}`);
  } catch (error) {
    if (error instanceof Error) {
      const $container = document.querySelector(".container");
      $container.replaceChildren(
        ErrorPage("영화 리스트를 불러오는데 실패하였습니다.")
      );
    }
  }
};
const Header = (movie) => {
  const $header = document.getElementById("header");
  if (!$header) {
    return;
  }
  $header.innerHTML = /*html*/
  `
    <div class="background-container">
      <div class="overlay" aria-hidden="true">
        <img src="https://media.themoviedb.org/t/p/w440_and_h660_face${movie.poster_path}" alt="MovieList" />
      </div>
      <div class="top-rated-container">
        <div class="header-container">
          <a href="/" class="logo">
            <img src="./images/logo.png" alt="MovieList" />
          </a>
          <form class="search-form">
            <input id="search-input" name="search-input" type="text" placeholder="검색어를 입력하세요" />
            <button type="submit" class="search-button">
              <img src="./images/search.png" alt="Search" />
            </button>
          </form>
        </div>
        <div class="top-rated-movie">
          <div class="rate">
            <img src="./images/star_empty.png" class="star" />
            <span class="rate-value">${movie.vote_average}</span>
          </div>
          <div class="title">${movie.name}</div>
          ${CustomButton({ title: "자세히 보기" }).outerHTML}
        </div>
      </div>
    </div>
  `;
};
const MovieSkeleton = () => {
  const skeletonItem = document.createElement("li");
  skeletonItem.innerHTML = /*html*/
  `
      <div class="item skeleton-item">
        <div class="thumbnail skeleton-thumbnail"></div>
        <div class="item-desc">
          <p class="rate skeleton-rate"></p>
          <div class="skeleton-title"></div>
        </div>
      </div>
    `;
  return skeletonItem;
};
const createSkeletons = (count = 10) => {
  const skeleton = document.createElement("div");
  skeleton.classList.add("skeleton");
  for (let i = 0; i < count; i++) {
    skeleton.appendChild(MovieSkeleton());
  }
  return skeleton;
};
function showSkeletons($container, count = 10) {
  $container.appendChild(createSkeletons(count));
}
const getSearchedMovie = async (query, page) => {
  try {
    return await apiClient(
      "GET",
      `/search/movie?query=${query}&include_adult=true&language=ko-KR&page=${page}`
    );
  } catch (error) {
    if (error instanceof Error) {
      const $container = document.querySelector(".container");
      $container.replaceChildren(
        ErrorPage("검색 결과를 불러오는데 실패하였습니다.")
      );
    }
  }
};
const toElement = (htmlString) => {
  const template = document.createElement("template");
  template.innerHTML = htmlString.trim();
  return template.content.firstChild;
};
function MovieCard(movieTitle, movie) {
  const movieImgPath = movie.poster_path ? `https://media.themoviedb.org/t/p/w440_and_h660_face${movie.poster_path}` : "images/nullImage.png";
  return toElement(`
    <li class="item">
      <img
        class="thumbnail"
        src=${movieImgPath}
        alt=${movieTitle}
      />
      <div class="item-desc">
        <p class="rate">
          <img src="./images/star_empty.png" class="star" /><span
            >${movie.vote_average.toFixed(1)}</span
          >
        </p>
        <strong>${movieTitle}</strong>
      </div>
    </li>
  `);
}
function MoreMoviesButton() {
  return document.getElementById("more-movies-button");
}
const EmptySearchResult = () => {
  const emptySearchResult = document.createElement("div");
  emptySearchResult.classList.add("empty-search-result-container");
  emptySearchResult.innerHTML = /*html*/
  `
    <img src="./images/으아아행성이.png" alt="검색 결과가 없습니다." class="empty-search-result-image"/>
    <p class="empty-search-result-text">검색 결과가 없습니다.</p>
  `;
  return emptySearchResult;
};
function showEmptySearchResult() {
  const $movieContainer = document.getElementById("movie-container");
  const $emptySearchResult = document.querySelector(
    ".empty-search-result-container"
  );
  if (!$emptySearchResult) {
    $movieContainer == null ? void 0 : $movieContainer.appendChild(EmptySearchResult());
  }
  const $moreMoviesButton = MoreMoviesButton();
  $moreMoviesButton == null ? void 0 : $moreMoviesButton.classList.add("disabled");
}
function addMovieCard(movieList, $movieListContainer) {
  if (movieList.length === 0) {
    showEmptySearchResult();
    return;
  }
  const $emptySearchResult = document.querySelector(
    ".empty-search-result-container"
  );
  const $moreMoviesButton = MoreMoviesButton();
  if ($emptySearchResult) {
    $emptySearchResult.remove();
    $moreMoviesButton == null ? void 0 : $moreMoviesButton.classList.remove("disabled");
  }
  addMoreMovies$1($movieListContainer, movieList);
}
function addMoreMovies$1($movieListContainer, movieList) {
  const fragment = document.createDocumentFragment();
  if (movieList[0].title) {
    fragment.append(
      ...movieList.map((movie) => MovieCard(movie.title, movie))
    );
    $movieListContainer.appendChild(fragment);
    return;
  }
  fragment.append(
    ...movieList.map((movie) => MovieCard(movie.name, movie))
  );
  $movieListContainer.appendChild(fragment);
}
function disableMoreButton(totalPages, currentPage) {
  const $moreMoviesButton = MoreMoviesButton();
  if (totalPages === currentPage) {
    $moreMoviesButton == null ? void 0 : $moreMoviesButton.classList.add("disabled");
  }
}
const getUrlParams = () => {
  return new URLSearchParams(window.location.search);
};
async function addMoreMovies($movieList) {
  const params = getUrlParams();
  const page = params.get("page");
  const query = params.get("query");
  if (!page) {
    params.append("page", "2");
  } else {
    params.set("page", (parseInt(page) + 1).toString());
  }
  if (query) {
    const searchedMovies = await getSearchedMovie(
      query,
      parseInt(params.get("page"))
    );
    if (!searchedMovies) {
      return;
    }
    addMovieCard(searchedMovies.results, $movieList);
    disableMoreButton(
      searchedMovies.total_pages,
      parseInt(params.get("page"))
    );
  } else {
    const movies = await getMovieList({ page: parseInt(params.get("page")) });
    if (!movies) {
      return;
    }
    addMovieCard(movies.results, $movieList);
    disableMoreButton(movies.total_pages, parseInt(params.get("page")));
  }
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  history.pushState(null, "", newUrl);
}
const updateUrl = (params) => {
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  history.pushState(null, "", newUrl);
};
const searchFormSubmitHandler = async (e) => {
  const $thumbnailList = document.querySelector(
    ".thumbnail-list"
  );
  if ($thumbnailList) {
    $thumbnailList.innerHTML = "";
    showSkeletons($thumbnailList);
  }
  disableElements();
  const $movieListTitle = document.querySelector(".movie-list-title");
  const formData = new FormData(e.target);
  let searchQuery = formData.get("search-input");
  if ($movieListTitle) {
    $movieListTitle.textContent = `"${searchQuery}" 검색 결과`;
  }
  const params = getUrlParams();
  updateUrlParams(params, searchQuery);
  const searchedMovies = await getSearchedMovie(
    searchQuery,
    parseInt(params.get("page"))
  );
  if ($thumbnailList && searchedMovies) {
    $thumbnailList.innerHTML = "";
    addMovieCard(searchedMovies.results, $thumbnailList);
  }
  updateUrl(params);
};
function disableElements() {
  const $overlay = document.querySelector(".overlay");
  $overlay == null ? void 0 : $overlay.classList.add("disabled");
  const $topRatedMovie = document.querySelector(".top-rated-movie");
  $topRatedMovie == null ? void 0 : $topRatedMovie.classList.add("disabled");
  const $backgroundContainer = document.querySelector(".background-container");
  $backgroundContainer == null ? void 0 : $backgroundContainer.classList.add("background-container-disabled");
}
function updateUrlParams(params, searchQuery) {
  const page = params.get("page");
  if (!page) {
    params.append("page", "1");
    params.append("query", searchQuery);
  } else {
    params.set("page", "1");
    params.set("query", searchQuery);
  }
}
const removeSkeletons = () => {
  const $skeleton = document.querySelector(".skeleton");
  $skeleton == null ? void 0 : $skeleton.remove();
};
async function init() {
  const $movieList = document.querySelector(".thumbnail-list");
  showSkeletons($movieList);
  const movies = await getMovieList({ page: 1 });
  if (movies && $movieList) {
    Header(movies.results[0]);
    removeSkeletons();
    addMovieCard(movies.results, $movieList);
  }
  const $movieContainer = document.getElementById("movie-container");
  const addMoreMoviesButton = CustomButton({
    title: "더보기",
    className: "add-more-button"
  });
  addMoreMoviesButton.id = "more-movies-button";
  $movieContainer == null ? void 0 : $movieContainer.appendChild(addMoreMoviesButton);
  const $moreMoviesButton = MoreMoviesButton();
  $moreMoviesButton == null ? void 0 : $moreMoviesButton.addEventListener("click", async () => {
    showSkeletons($movieList);
    if ($movieList) {
      removeSkeletons();
      await addMoreMovies($movieList);
    }
  });
  const searchForm = document.querySelector(".search-form");
  searchForm == null ? void 0 : searchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await searchFormSubmitHandler(e);
  });
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
