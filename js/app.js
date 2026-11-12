/**
 * 한국공학대학교 (TUKorea) 연구성과 혁신 포털
 * 몬드리안(Mondrian) & 흑백 아카이브 에디션 로직
 */

// 애플리케이션 상태 관리
const AppState = {
  searchQuery: "",
  category: "all",
  type: "all",
  year: "all",
  trl: "all",
  sortBy: "latest",
  viewMode: "grid",
  bookmarks: JSON.parse(localStorage.getItem("tuk_bookmarks") || "[]"),
  darkMode: localStorage.getItem("tuk_theme") === "dark" || 
            (!("tuk_theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches),
  currentModalItem: null,
  charts: {
    annual: null,
    field: null
  }
};

// DOM 로드 완료 후 초기화
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initStats();
  initIccSection();
  initFilters();
  initSearch();
  initCharts();
  renderResearchList();
  updateBookmarkCount();
  setupKeyboardShortcuts();
  
  if (window.lucide) {
    lucide.createIcons();
  }
});

/**
 * 테마 초기화
 */
function initTheme() {
  const html = document.documentElement;
  if (AppState.darkMode) {
    html.classList.add("dark");
  } else {
    html.classList.remove("dark");
  }

  const themeToggleBtn = document.getElementById("theme-toggle-btn");
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      AppState.darkMode = !AppState.darkMode;
      if (AppState.darkMode) {
        html.classList.add("dark");
        localStorage.setItem("tuk_theme", "dark");
        showToast("다크 모드로 전환되었습니다.", "info");
      } else {
        html.classList.remove("dark");
        localStorage.setItem("tuk_theme", "light");
        showToast("라이트 모드로 전환되었습니다.", "info");
      }
      updateThemeIcons();
      refreshChartsTheme();
    });
  }
  updateThemeIcons();
}

function updateThemeIcons() {
  const sunIcon = document.getElementById("icon-sun");
  const moonIcon = document.getElementById("icon-moon");
  if (sunIcon && moonIcon) {
    if (AppState.darkMode) {
      sunIcon.classList.remove("hidden");
      moonIcon.classList.add("hidden");
    } else {
      sunIcon.classList.add("hidden");
      moonIcon.classList.remove("hidden");
    }
  }
}

/**
 * 포털 상단 지표 카운터 초기화
 */
function initStats() {
  const statFamily = document.getElementById("stat-family");
  const statPatents = document.getElementById("stat-patents");
  const statJournals = document.getElementById("stat-journals");
  const statTransfer = document.getElementById("stat-transfer");
  const statRatio = document.getElementById("stat-ratio");

  if (statFamily) statFamily.textContent = PORTAL_STATS.familyCompanies;
  if (statPatents) statPatents.textContent = PORTAL_STATS.patentsRegistered;
  if (statJournals) statJournals.textContent = PORTAL_STATS.topRankJournals;
  if (statTransfer) statTransfer.textContent = PORTAL_STATS.techTransferTotal;
  if (statRatio) statRatio.textContent = PORTAL_STATS.industryGrantsRatio;
}

/**
 * 5T 특화연구센터(ICC) 몬드리안 블록 렌더링
 */
function initIccSection() {
  const container = document.getElementById("icc-cards-container");
  if (!container) return;

  // 몬드리안 시그니처 배색 맵
  const colorMap = {
    semiconductor: { tag: "m-block-blue", line: "border-blue-600", accent: "text-blue-600 dark:text-blue-400", bgLight: "bg-blue-50/60 dark:bg-blue-950/30" },
    ai: { tag: "m-block-red", line: "border-red-600", accent: "text-red-600 dark:text-red-400", bgLight: "bg-red-50/60 dark:bg-red-950/30" },
    bio: { tag: "m-block-yellow", line: "border-amber-500", accent: "text-amber-600 dark:text-amber-400", bgLight: "bg-amber-50/60 dark:bg-amber-950/30" },
    mobility: { tag: "m-block-black", line: "border-slate-800", accent: "text-slate-800 dark:text-slate-200", bgLight: "bg-slate-100/70 dark:bg-slate-800/40" },
    energy: { tag: "m-block-blue", line: "border-teal-600", accent: "text-teal-600 dark:text-teal-400", bgLight: "bg-teal-50/60 dark:bg-teal-950/30" }
  };

  // 연구실 흑백 사진 매핑
  const photoMap = {
    semiconductor: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
    ai: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=600&q=80",
    bio: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=600&q=80",
    mobility: "https://images.unsplash.com/photo-1558441719-74e50882ef13?auto=format&fit=crop&w=600&q=80",
    energy: "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=600&q=80"
  };

  container.innerHTML = ICC_CENTERS.map(icc => {
    const style = colorMap[icc.category] || colorMap.semiconductor;
    const photo = photoMap[icc.category];

    return `
      <div class="mondrian-card flex flex-col justify-between overflow-hidden group">
        
        <!-- 상단 흑백 사진 헤더 & 몬드리안 태그 -->
        <div class="bw-photo-container h-32 border-b-2 border-slate-900 dark:border-slate-700 relative">
          <img src="${photo}" alt="${icc.name}" class="bw-photo w-full h-full object-cover">
          <div class="absolute inset-0 bg-black/40"></div>
          
          <div class="absolute top-2 left-2 flex items-center gap-1.5">
            <span class="m-badge px-2.5 py-0.5 text-[10px] ${style.tag}">
              ${icc.code}
            </span>
          </div>

          <div class="absolute bottom-2 left-2 right-2">
            <h4 class="text-xs font-black text-white tracking-tight truncate drop-shadow-md">
              ${icc.name}
            </h4>
          </div>
        </div>

        <!-- 본문 내용 -->
        <div class="p-5 flex-1 flex flex-col justify-between">
          <div>
            <p class="text-[11px] font-mono font-bold text-slate-400 mb-2">${icc.nameEn}</p>
            <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3 mb-4">
              ${icc.description}
            </p>

            <!-- 핵심 지표 블록 (몬드리안 격자형) -->
            <div class="grid grid-cols-2 gap-1.5 border-2 border-slate-900 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-900/60 mb-4 text-[11px]">
              <div>
                <span class="text-slate-400 block text-[10px]">가족회사</span>
                <span class="font-black text-slate-900 dark:text-white">${icc.keyMetrics.partnersCount}</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px]">R&D 수주</span>
                <span class="font-black text-slate-900 dark:text-white">${icc.keyMetrics.grantsSum}</span>
              </div>
            </div>
          </div>

          <div class="pt-3 border-t-2 border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span class="text-[11px] text-slate-500 truncate max-w-[140px]" title="${icc.leadProf}">
              ${icc.leadProf.split('/')[0]}
            </span>
            <button onclick="filterByIccCategory('${icc.category}')" class="px-3 py-1 text-xs font-extrabold border-2 border-slate-900 dark:border-slate-200 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-colors inline-flex items-center gap-1">
              성과보기 <i data-lucide="arrow-right" class="w-3 h-3"></i>
            </button>
          </div>
        </div>

      </div>
    `;
  }).join("");

  if (window.lucide) lucide.createIcons();
}

/**
 * 필터 및 컨트롤 바 이벤트 바인딩
 */
function initFilters() {
  const categoryPills = document.querySelectorAll(".category-pill");
  categoryPills.forEach(pill => {
    pill.addEventListener("click", () => {
      categoryPills.forEach(p => {
        p.classList.remove("active", "m-block-red", "m-block-blue", "text-white");
        p.classList.add("bg-white", "dark:bg-slate-800", "text-slate-800", "dark:text-slate-200");
      });
      pill.classList.add("active", "m-block-red", "text-white");
      pill.classList.remove("bg-white", "dark:bg-slate-800", "text-slate-800", "dark:text-slate-200");

      AppState.category = pill.dataset.category;
      renderResearchList();
    });
  });

  const typeFilter = document.getElementById("filter-type");
  if (typeFilter) {
    typeFilter.addEventListener("change", (e) => {
      AppState.type = e.target.value;
      renderResearchList();
    });
  }

  const yearFilter = document.getElementById("filter-year");
  if (yearFilter) {
    yearFilter.addEventListener("change", (e) => {
      AppState.year = e.target.value;
      renderResearchList();
    });
  }

  const trlFilter = document.getElementById("filter-trl");
  if (trlFilter) {
    trlFilter.addEventListener("change", (e) => {
      AppState.trl = e.target.value;
      renderResearchList();
    });
  }

  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      AppState.sortBy = e.target.value;
      renderResearchList();
    });
  }

  const btnGrid = document.getElementById("view-grid-btn");
  const btnList = document.getElementById("view-list-btn");
  if (btnGrid && btnList) {
    btnGrid.addEventListener("click", () => {
      AppState.viewMode = "grid";
      btnGrid.classList.add("bg-slate-900", "text-white", "dark:bg-white", "dark:text-slate-900");
      btnList.classList.remove("bg-slate-900", "text-white", "dark:bg-white", "dark:text-slate-900");
      renderResearchList();
    });
    btnList.addEventListener("click", () => {
      AppState.viewMode = "list";
      btnList.classList.add("bg-slate-900", "text-white", "dark:bg-white", "dark:text-slate-900");
      btnGrid.classList.remove("bg-slate-900", "text-white", "dark:bg-white", "dark:text-slate-900");
      renderResearchList();
    });
  }

  const resetBtn = document.getElementById("reset-filters-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", resetAllFilters);
  }

  const exportCsvBtn = document.getElementById("export-csv-btn");
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener("click", exportCurrentDataToCSV);
  }
}

/**
 * 검색 디바운스
 */
function initSearch() {
  const searchInput = document.getElementById("search-input");
  const clearBtn = document.getElementById("search-clear-btn");

  if (!searchInput) return;

  let debounceTimer;
  searchInput.addEventListener("input", (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      AppState.searchQuery = e.target.value.trim();
      if (clearBtn) {
        clearBtn.classList.toggle("hidden", AppState.searchQuery === "");
      }
      renderResearchList();
    }, 200);
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      searchInput.value = "";
      AppState.searchQuery = "";
      clearBtn.classList.add("hidden");
      renderResearchList();
      searchInput.focus();
    });
  }
}

/**
 * 필터링 & 정렬
 */
function getFilteredResearchList() {
  return RESEARCH_DATA.filter(item => {
    if (AppState.category !== "all" && item.category !== AppState.category) return false;
    if (AppState.type !== "all" && item.type !== AppState.type) return false;
    if (AppState.year !== "all") {
      if (AppState.year === "prior" && item.year >= 2024) return false;
      if (AppState.year !== "prior" && item.year !== parseInt(AppState.year)) return false;
    }
    if (AppState.trl !== "all") {
      if (AppState.trl === "basic" && (item.trl < 1 || item.trl > 3)) return false;
      if (AppState.trl === "applied" && (item.trl < 4 || item.trl > 6)) return false;
      if (AppState.trl === "commercial" && (item.trl < 7 || item.trl > 9)) return false;
    }
    if (AppState.searchQuery) {
      const q = AppState.searchQuery.toLowerCase();
      const authorMatch = item.authors.some(a => a.name.toLowerCase().includes(q) || a.role.toLowerCase().includes(q));
      const tagMatch = item.tags.some(t => t.toLowerCase().includes(q));
      const match = item.title.toLowerCase().includes(q) ||
                    (item.titleEn && item.titleEn.toLowerCase().includes(q)) ||
                    item.leadProfessor.toLowerCase().includes(q) ||
                    item.lab.toLowerCase().includes(q) ||
                    item.summary.toLowerCase().includes(q) ||
                    (item.journal && item.journal.toLowerCase().includes(q)) ||
                    (item.patentNo && item.patentNo.toLowerCase().includes(q)) ||
                    authorMatch || tagMatch;
      if (!match) return false;
    }
    return true;
  }).sort((a, b) => {
    if (AppState.sortBy === "latest") {
      return new Date(b.date) - new Date(a.date);
    } else if (AppState.sortBy === "citations") {
      return (b.citationsCount || 0) - (a.citationsCount || 0);
    } else if (AppState.sortBy === "trl") {
      return b.trl - a.trl;
    }
    return 0;
  });
}

/**
 * 성과 목록 렌더링
 */
function renderResearchList() {
  const container = document.getElementById("research-grid");
  const countBadge = document.getElementById("results-count-badge");
  const emptyState = document.getElementById("empty-state");

  if (!container) return;

  const filtered = getFilteredResearchList();

  if (countBadge) {
    countBadge.textContent = `${filtered.length}건`;
  }

  if (filtered.length === 0) {
    container.innerHTML = "";
    if (emptyState) emptyState.classList.remove("hidden");
    return;
  }

  if (emptyState) emptyState.classList.add("hidden");

  if (AppState.viewMode === "list") {
    container.className = "space-y-4";
  } else {
    container.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";
  }

  container.innerHTML = filtered.map(item => {
    return AppState.viewMode === "list" 
      ? renderListItemHtml(item) 
      : renderCardItemHtml(item);
  }).join("");

  if (window.lucide) lucide.createIcons();
}

/**
 * 몬드리안 스타일 카드 뷰 HTML
 */
function renderCardItemHtml(item) {
  const isBookmarked = AppState.bookmarks.includes(item.id);
  const typeMeta = getTypeMetadata(item.type);
  const categoryMeta = getCategoryMetadata(item.category);
  const mondrianAccent = getMondrianCategoryAccent(item.category);

  // 성과별 흑백 연구실 썸네일
  const thumbUrl = getThumbnailForResearch(item.category, item.id);

  return `
    <div class="mondrian-card flex flex-col justify-between overflow-hidden group">
      
      <!-- 상단 컬러 바 & 메타 -->
      <div>
        <div class="h-2 w-full ${mondrianAccent.topBar}"></div>

        <!-- 흑백 연구 썸네일 & 뱃지 오버레이 -->
        <div class="bw-photo-container h-28 border-b-2 border-slate-900 dark:border-slate-700 relative">
          <img src="${thumbUrl}" alt="${item.title}" class="bw-photo w-full h-full object-cover">
          <div class="absolute inset-0 bg-black/40"></div>

          <!-- 뱃지 태그 -->
          <div class="absolute top-2 left-2 flex flex-wrap items-center gap-1.5 z-10">
            <span class="m-badge px-2 py-0.5 text-[10px] ${typeMeta.badgeClass}">
              ${typeMeta.name}
            </span>
            <span class="m-badge px-2 py-0.5 text-[10px] bg-white text-black">
              ${categoryMeta.name}
            </span>
          </div>

          <!-- 북마크 버튼 -->
          <button onclick="toggleBookmark('${item.id}', event)" 
                  title="${isBookmarked ? '북마크 해제' : '북마크 저장'}"
                  class="absolute top-2 right-2 p-1.5 bg-white border-2 border-slate-900 hover:bg-red-500 hover:text-white transition-colors z-10 ${isBookmarked ? 'bg-red-600 text-white' : 'text-slate-800'}">
            <i data-lucide="${isBookmarked ? 'bookmark-check' : 'bookmark'}" class="w-3.5 h-3.5 fill-current"></i>
          </button>

          <!-- 하단 연도 표기 -->
          <span class="absolute bottom-1 right-2 text-[11px] font-mono font-black text-white/90 drop-shadow">
            ${item.year}
          </span>
        </div>

        <div class="p-5">
          <!-- 수상/기조강연/선정 하이라이트 -->
          ${item.badge ? `
            <div class="mb-2">
              <span class="m-badge px-2 py-0.5 text-[10px] ${mondrianAccent.highlight}">
                ★ ${item.badge}
              </span>
            </div>
          ` : ''}

          <!-- 제목 -->
          <h3 onclick="openDetailModal('${item.id}')" 
              class="text-base font-black text-slate-900 dark:text-white hover:text-red-600 dark:hover:text-amber-400 cursor-pointer transition-colors leading-snug mb-2 line-clamp-2">
            ${item.title}
          </h3>

          <!-- 게재처 / 특허 번호 -->
          <p class="text-xs text-slate-500 dark:text-slate-400 font-medium mb-3 truncate" title="${item.journal}">
            ${item.journal || item.patentNo || '한국공학대학교 산학협력단'}
          </p>

          <!-- 연구진 -->
          <div class="flex items-center gap-1.5 mb-3 text-xs font-bold text-slate-800 dark:text-slate-200">
            <span class="w-2 h-2 ${mondrianAccent.topBar}"></span>
            <span>${item.leadProfessor}</span>
          </div>

          <!-- 요약문 -->
          <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4 line-clamp-3">
            ${item.summary}
          </p>

          <!-- 태그 -->
          <div class="flex flex-wrap gap-1 mb-2">
            ${item.tags.slice(0, 3).map(tag => `
              <span class="text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 border border-slate-300 dark:border-slate-700">
                #${tag}
              </span>
            `).join("")}
          </div>
        </div>
      </div>

      <!-- 하단: TRL 및 액션 버튼 바 -->
      <div class="px-5 pb-5">
        <div class="pt-3 border-t-2 border-slate-900 dark:border-slate-700 mb-3">
          <div class="flex items-center justify-between text-[11px] mb-1.5 font-mono">
            <span class="font-bold text-slate-500">TRL (기술성숙도)</span>
            <span class="font-black text-slate-900 dark:text-white">STAGE ${item.trl}/9</span>
          </div>
          <div class="flex border-2 border-slate-900 dark:border-slate-700 overflow-hidden">
            ${Array.from({ length: 9 }).map((_, idx) => `
              <div class="mondrian-trl-step ${idx < item.trl ? mondrianAccent.trlActive : ''}"></div>
            `).join("")}
          </div>
        </div>

        <div class="flex items-center gap-1.5">
          <button onclick="openDetailModal('${item.id}')" 
                  class="flex-1 py-2 px-3 border-2 border-slate-900 dark:border-slate-300 font-extrabold text-xs hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-colors flex items-center justify-center gap-1">
            <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
            상세 보기
          </button>
          
          <button onclick="copyCitation('${item.id}')" 
                  title="인용구 복사"
                  class="p-2 border-2 border-slate-900 dark:border-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <i data-lucide="quote" class="w-3.5 h-3.5"></i>
          </button>

          <button onclick="openConsultationModal('${item.id}')" 
                  title="기술이전 상담 신청"
                  class="p-2 border-2 border-slate-900 dark:border-slate-300 bg-amber-400 hover:bg-amber-500 text-slate-900 transition-colors">
            <i data-lucide="briefcase" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>

    </div>
  `;
}

/**
 * 몬드리안 스타일 리스트 뷰 HTML
 */
function renderListItemHtml(item) {
  const isBookmarked = AppState.bookmarks.includes(item.id);
  const typeMeta = getTypeMetadata(item.type);
  const categoryMeta = getCategoryMetadata(item.category);
  const mondrianAccent = getMondrianCategoryAccent(item.category);
  const thumbUrl = getThumbnailForResearch(item.category, item.id);

  return `
    <div class="mondrian-card p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div class="flex items-start gap-4 flex-1">
        
        <div class="hidden sm:block w-24 h-24 bw-photo-container border-2 border-slate-900 dark:border-slate-700 flex-shrink-0">
          <img src="${thumbUrl}" alt="${item.title}" class="bw-photo w-full h-full object-cover">
        </div>

        <div class="flex-1">
          <div class="flex flex-wrap items-center gap-2 mb-1.5">
            <span class="m-badge px-2 py-0.5 text-[10px] ${typeMeta.badgeClass}">
              ${typeMeta.name}
            </span>
            <span class="text-xs font-mono font-bold text-slate-500">
              ${categoryMeta.name} · ${item.year}
            </span>
            ${item.badge ? `
              <span class="m-badge px-2 py-0.5 text-[10px] ${mondrianAccent.highlight}">
                ★ ${item.badge}
              </span>
            ` : ''}
          </div>

          <h3 onclick="openDetailModal('${item.id}')" 
              class="text-base font-black text-slate-900 dark:text-white hover:text-red-600 dark:hover:text-amber-400 cursor-pointer transition-colors mb-1">
            ${item.title}
          </h3>

          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">
            <span><strong>책임:</strong> ${item.leadProfessor}</span>
            <span><strong>소속:</strong> ${item.lab}</span>
            <span><strong>TRL:</strong> Stage ${item.trl}/9</span>
          </div>

          <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
            ${item.summary}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-1.5 w-full md:w-auto justify-end">
        <button onclick="toggleBookmark('${item.id}', event)" 
                class="p-2 border-2 border-slate-900 dark:border-slate-300 ${isBookmarked ? 'bg-red-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'} transition-colors">
          <i data-lucide="${isBookmarked ? 'bookmark-check' : 'bookmark'}" class="w-4 h-4 fill-current"></i>
        </button>
        <button onclick="copyCitation('${item.id}')" 
                class="p-2 border-2 border-slate-900 dark:border-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="인용구 복사">
          <i data-lucide="quote" class="w-4 h-4"></i>
        </button>
        <button onclick="openDetailModal('${item.id}')" 
                class="px-4 py-2 border-2 border-slate-900 bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-extrabold text-xs hover:bg-red-600 dark:hover:bg-amber-400 hover:border-red-600 transition-colors">
          상세 보기
        </button>
      </div>
    </div>
  `;
}

/**
 * 연구 분야별 흑백 썸네일 매핑
 */
function getThumbnailForResearch(category, id) {
  const thumbs = {
    semiconductor: [
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80"
    ],
    ai: [
      "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=400&q=80"
    ],
    bio: [
      "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=400&q=80"
    ],
    mobility: [
      "https://images.unsplash.com/photo-1558441719-74e50882ef13?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=400&q=80"
    ],
    energy: [
      "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=400&q=80"
    ]
  };

  const list = thumbs[category] || thumbs.semiconductor;
  // ID 해시를 통해 일관된 썸네일 선정
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash += id.charCodeAt(i);
  return list[hash % list.length];
}

/**
 * 몬드리안 카테고리 악센트 매핑
 */
function getMondrianCategoryAccent(category) {
  switch (category) {
    case "ai":
      return { topBar: "m-block-red", highlight: "bg-red-600 text-white", trlActive: "active-red" };
    case "semiconductor":
      return { topBar: "m-block-blue", highlight: "bg-blue-700 text-white", trlActive: "active-blue" };
    case "bio":
      return { topBar: "m-block-yellow", highlight: "bg-amber-400 text-slate-900", trlActive: "active-yellow" };
    case "mobility":
      return { topBar: "m-block-black", highlight: "bg-slate-900 text-white", trlActive: "active-blue" };
    case "energy":
      return { topBar: "m-block-blue", highlight: "bg-teal-700 text-white", trlActive: "active-blue" };
    default:
      return { topBar: "m-block-red", highlight: "bg-slate-900 text-white", trlActive: "active-red" };
  }
}

/**
 * 성과 상세 모달 열기
 */
function openDetailModal(id) {
  const item = RESEARCH_DATA.find(r => r.id === id);
  if (!item) return;

  AppState.currentModalItem = item;
  const modal = document.getElementById("detail-modal");
  const modalBody = document.getElementById("detail-modal-body");

  if (!modal || !modalBody) return;

  const typeMeta = getTypeMetadata(item.type);
  const categoryMeta = getCategoryMetadata(item.category);
  const isBookmarked = AppState.bookmarks.includes(item.id);
  const thumbUrl = getThumbnailForResearch(item.category, item.id);

  modalBody.innerHTML = `
    <!-- 모달 상단 몬드리안 구도 -->
    <div class="mb-6">
      
      <!-- 흑백 연구 현장 배너 -->
      <div class="bw-photo-container h-44 border-2 border-slate-900 dark:border-slate-700 relative mb-4">
        <img src="${thumbUrl}" alt="${item.title}" class="bw-photo w-full h-full object-cover">
        <div class="absolute inset-0 bg-black/45"></div>

        <div class="absolute top-3 left-3 flex flex-wrap gap-2">
          <span class="m-badge px-2.5 py-0.5 text-xs ${typeMeta.badgeClass}">
            ${typeMeta.name}
          </span>
          <span class="m-badge px-2.5 py-0.5 text-xs bg-white text-black">
            ${categoryMeta.name}
          </span>
        </div>

        <div class="absolute bottom-3 left-3 right-3 text-white">
          <span class="text-xs font-mono font-bold block mb-1 opacity-90">${item.date} 발표/등록</span>
          <h2 class="text-lg md:text-xl font-black leading-snug drop-shadow-md">
            ${item.title}
          </h2>
        </div>
      </div>

      ${item.titleEn ? `
        <p class="text-xs font-mono text-slate-500 italic mb-3">${item.titleEn}</p>
      ` : ''}

      ${item.badge ? `
        <div class="m-badge px-3 py-1 text-xs bg-red-600 text-white mb-4">
          ★ ${item.badge} · ${item.grade}
        </div>
      ` : ''}
    </div>

    <!-- TRL 프로그레스 -->
    <div class="border-2 border-slate-900 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-900 mb-6">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-black uppercase tracking-wider">기술 성숙도 단계 (TRL)</span>
        <span class="text-xs font-mono font-bold text-red-600 dark:text-amber-400">
          Stage ${item.trl}/9 : ${getTrlDescription(item.trl)}
        </span>
      </div>
      <div class="flex border-2 border-slate-900 dark:border-slate-700 h-3 mb-2">
        ${Array.from({ length: 9 }).map((_, idx) => `
          <div class="mondrian-trl-step ${idx < item.trl ? 'active-red' : ''}"></div>
        `).join("")}
      </div>
      <div class="flex justify-between text-[10px] text-slate-500 font-mono">
        <span>TRL 1~3: 기초 연구</span>
        <span>TRL 4~6: 시제품 실증</span>
        <span>TRL 7~9: 상용화 및 양산</span>
      </div>
    </div>

    <!-- 몬드리안 정보 박스 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
      <div class="border-2 border-slate-900 dark:border-slate-700 p-3 bg-white dark:bg-slate-950">
        <span class="text-[11px] font-mono text-slate-400 block mb-0.5">연구 책임자</span>
        <span class="text-sm font-black text-slate-900 dark:text-white">${item.leadProfessor}</span>
        <span class="text-xs text-slate-500 block">${item.lab}</span>
      </div>
      <div class="border-2 border-slate-900 dark:border-slate-700 p-3 bg-white dark:bg-slate-950">
        <span class="text-[11px] font-mono text-slate-400 block mb-0.5">연계 5T ICC 및 기술 가치</span>
        <span class="text-sm font-black text-slate-900 dark:text-white">${item.iccCenter}</span>
        <span class="text-xs text-blue-600 dark:text-cyan-400 font-bold block">${item.commercialValue}</span>
      </div>
    </div>

    <!-- 참여 연구진 -->
    <div class="mb-6">
      <h4 class="text-xs font-black uppercase tracking-wider mb-2">참여 연구진 (저자 / 발명자)</h4>
      <div class="flex flex-wrap gap-1.5">
        ${item.authors.map(author => `
          <div class="px-2.5 py-1 text-xs border border-slate-900 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
            <strong>${author.name}</strong> <span class="text-slate-500 text-[11px]">(${author.role})</span>
          </div>
        `).join("")}
      </div>
    </div>

    <!-- 초록 -->
    <div class="mb-6">
      <h4 class="text-xs font-black uppercase tracking-wider mb-2">연구 초록 (Abstract)</h4>
      <div class="border-2 border-slate-900 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-900/50 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        ${item.abstract}
      </div>
    </div>

    <!-- 산업적 파급 효과 -->
    <div class="mb-6 border-2 border-slate-900 dark:border-slate-700 p-4 bg-amber-50 dark:bg-amber-950/30 text-xs text-amber-950 dark:text-amber-200">
      <strong class="block mb-1 font-black">산업계 파급 효과 및 사업화 기대치</strong>
      <p class="leading-relaxed">${item.impact}</p>
    </div>

    <!-- 메타 식별자 -->
    <div class="border border-slate-300 dark:border-slate-700 p-3 mb-6 text-xs text-slate-600 dark:text-slate-400 font-mono space-y-1">
      ${item.doi ? `<div><strong>DOI:</strong> <a href="https://doi.org/${item.doi}" target="_blank" class="text-blue-600 underline">${item.doi}</a></div>` : ''}
      ${item.patentNo ? `<div><strong>특허/출원번호:</strong> <span class="font-bold text-slate-900 dark:text-white">${item.patentNo}</span></div>` : ''}
      <div><strong>게재처:</strong> ${item.journal || '한국공학대학교 산학협력 연구보고서'}</div>
    </div>

    <!-- 액션 버튼 -->
    <div class="flex flex-col sm:flex-row items-center gap-2 pt-4 border-t-2 border-slate-900 dark:border-slate-700">
      <button onclick="toggleBookmark('${item.id}')" 
              class="w-full sm:w-auto px-4 py-2.5 border-2 border-slate-900 dark:border-slate-300 text-xs font-black hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5">
        <i data-lucide="${isBookmarked ? 'bookmark-check' : 'bookmark'}" class="w-4 h-4 ${isBookmarked ? 'text-red-500 fill-current' : ''}"></i>
        ${isBookmarked ? '북마크 저장됨' : '관심 성과 보관'}
      </button>

      <button onclick="copyCitation('${item.id}')" 
              class="w-full sm:w-auto px-4 py-2.5 border-2 border-slate-900 dark:border-slate-300 text-xs font-black hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5">
        <i data-lucide="quote" class="w-4 h-4"></i>
        인용 복사
      </button>

      <button onclick="closeDetailModal(); openConsultationModal('${item.id}');" 
              class="w-full sm:flex-1 py-2.5 border-2 border-slate-900 bg-red-600 text-white hover:bg-red-700 font-black text-xs transition-colors flex items-center justify-center gap-2">
        <i data-lucide="handshake" class="w-4 h-4"></i>
        기술이전 및 산학공동 R&D 문의
      </button>
    </div>
  `;

  modal.classList.remove("modal-hidden");
  document.body.style.overflow = "hidden";
  if (window.lucide) lucide.createIcons();
}

function closeDetailModal() {
  const modal = document.getElementById("detail-modal");
  if (modal) {
    modal.classList.add("modal-hidden");
    document.body.style.overflow = "";
  }
}

/**
 * 인용문 복사
 */
function copyCitation(id) {
  const item = RESEARCH_DATA.find(r => r.id === id);
  if (!item) return;

  const authorsStr = item.authors.map(a => a.name).join(", ");
  const citationText = `[한국공학대학교 연구성과] ${authorsStr} (${item.year}). "${item.title}". ${item.journal || item.patentNo || 'TUKorea 산학협력단'}.${item.doi ? ' DOI: ' + item.doi : ''}`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(citationText).then(() => {
      showToast("연구 인용 정보가 복사되었습니다.", "success");
    }).catch(() => {
      fallbackCopy(citationText);
    });
  } else {
    fallbackCopy(citationText);
  }
}

function fallbackCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
  showToast("연구 인용 정보가 복사되었습니다.", "success");
}

/**
 * 북마크 토글
 */
function toggleBookmark(id, event) {
  if (event) event.stopPropagation();

  const idx = AppState.bookmarks.indexOf(id);
  if (idx > -1) {
    AppState.bookmarks.splice(idx, 1);
    showToast("북마크가 해제되었습니다.", "info");
  } else {
    AppState.bookmarks.push(id);
    showToast("관심 연구로 보관되었습니다.", "success");
  }

  localStorage.setItem("tuk_bookmarks", JSON.stringify(AppState.bookmarks));
  updateBookmarkCount();
  renderResearchList();

  if (AppState.currentModalItem && AppState.currentModalItem.id === id) {
    openDetailModal(id);
  }
}

function updateBookmarkCount() {
  const badge = document.getElementById("bookmark-counter-badge");
  if (badge) {
    badge.textContent = AppState.bookmarks.length;
    badge.classList.toggle("hidden", AppState.bookmarks.length === 0);
  }
}

/**
 * 북마크 모달
 */
function openBookmarksModal() {
  const modal = document.getElementById("bookmarks-modal");
  const listContainer = document.getElementById("bookmarks-list-container");
  if (!modal || !listContainer) return;

  const bookmarkedItems = RESEARCH_DATA.filter(item => AppState.bookmarks.includes(item.id));

  if (bookmarkedItems.length === 0) {
    listContainer.innerHTML = `
      <div class="text-center py-12 text-slate-400">
        <i data-lucide="bookmark" class="w-12 h-12 mx-auto mb-3 opacity-30"></i>
        <p class="text-sm font-bold">저장된 북마크가 없습니다.</p>
        <p class="text-xs text-slate-400 mt-1">관심 있는 연구성과의 북마크 아이콘을 눌러 저장해보세요.</p>
      </div>
    `;
  } else {
    listContainer.innerHTML = bookmarkedItems.map(item => `
      <div class="p-3 border-2 border-slate-900 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-start justify-between gap-3">
        <div class="flex-1 cursor-pointer" onclick="closeBookmarksModal(); openDetailModal('${item.id}');">
          <span class="text-[10px] font-mono font-bold text-red-600 dark:text-amber-400">${item.year} · ${getTypeMetadata(item.type).name}</span>
          <h4 class="text-xs sm:text-sm font-black text-slate-900 dark:text-white hover:underline mt-0.5">${item.title}</h4>
          <p class="text-[11px] text-slate-500 mt-0.5">${item.leadProfessor} (${item.lab})</p>
        </div>
        <button onclick="toggleBookmark('${item.id}'); openBookmarksModal();" class="text-slate-400 hover:text-red-500 p-1">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </div>
    `).join("");
  }

  modal.classList.remove("modal-hidden");
  document.body.style.overflow = "hidden";
  if (window.lucide) lucide.createIcons();
}

function closeBookmarksModal() {
  const modal = document.getElementById("bookmarks-modal");
  if (modal) {
    modal.classList.add("modal-hidden");
    document.body.style.overflow = "";
  }
}

/**
 * 상담 신청 모달
 */
function openConsultationModal(researchId = "") {
  const modal = document.getElementById("consultation-modal");
  const selectElem = document.getElementById("consult-research-select");

  if (!modal) return;

  if (selectElem) {
    selectElem.innerHTML = `
      <option value="">일반 산학협력 / 기술 매칭 문의</option>
      ${RESEARCH_DATA.map(r => `
        <option value="${r.id}" ${r.id === researchId ? "selected" : ""}>
          [${getTypeMetadata(r.type).name}] ${r.title.slice(0, 36)}... (${r.leadProfessor})
        </option>
      `).join("")}
    `;
  }

  modal.classList.remove("modal-hidden");
  document.body.style.overflow = "hidden";
  if (window.lucide) lucide.createIcons();
}

function closeConsultationModal() {
  const modal = document.getElementById("consultation-modal");
  if (modal) {
    modal.classList.add("modal-hidden");
    document.body.style.overflow = "";
  }
}

/**
 * 상담 신청서 제출
 */
function handleConsultationSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const companyName = form.companyName.value.trim();
  const contactName = form.contactName.value.trim();
  const contactEmail = form.contactEmail.value.trim();

  if (!companyName || !contactName || !contactEmail) {
    showToast("필수 입력 항목을 확인해주세요.", "warning");
    return;
  }

  const ticketId = `TUK-IAC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  closeConsultationModal();

  const successModal = document.getElementById("success-modal");
  const ticketSpan = document.getElementById("success-ticket-id");
  if (successModal && ticketSpan) {
    ticketSpan.textContent = ticketId;
    successModal.classList.remove("modal-hidden");
  }

  showToast(`상담 신청 접수 완료 (접수번호: ${ticketId})`, "success");
  form.reset();
}

function closeSuccessModal() {
  const modal = document.getElementById("success-modal");
  if (modal) {
    modal.classList.add("modal-hidden");
    document.body.style.overflow = "";
  }
}

/**
 * ICC 카테고리 필터링
 */
function filterByIccCategory(cat) {
  const researchSection = document.getElementById("research-section");
  if (researchSection) {
    researchSection.scrollIntoView({ behavior: "smooth" });
  }

  const categoryPills = document.querySelectorAll(".category-pill");
  categoryPills.forEach(pill => {
    if (pill.dataset.category === cat) {
      pill.click();
    }
  });
}

/**
 * 모든 필터 리셋
 */
function resetAllFilters() {
  AppState.searchQuery = "";
  AppState.category = "all";
  AppState.type = "all";
  AppState.year = "all";
  AppState.trl = "all";
  AppState.sortBy = "latest";

  const searchInput = document.getElementById("search-input");
  if (searchInput) searchInput.value = "";

  const clearBtn = document.getElementById("search-clear-btn");
  if (clearBtn) clearBtn.classList.add("hidden");

  const categoryPills = document.querySelectorAll(".category-pill");
  categoryPills.forEach(pill => {
    if (pill.dataset.category === "all") {
      pill.classList.add("active", "m-block-red", "text-white");
      pill.classList.remove("bg-white", "dark:bg-slate-800", "text-slate-800", "dark:text-slate-200");
    } else {
      pill.classList.remove("active", "m-block-red", "text-white");
      pill.classList.add("bg-white", "dark:bg-slate-800", "text-slate-800", "dark:text-slate-200");
    }
  });

  const typeFilter = document.getElementById("filter-type");
  if (typeFilter) typeFilter.value = "all";

  const yearFilter = document.getElementById("filter-year");
  if (yearFilter) yearFilter.value = "all";

  const trlFilter = document.getElementById("filter-trl");
  if (trlFilter) trlFilter.value = "all";

  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) sortSelect.value = "latest";

  renderResearchList();
  showToast("모든 필터가 초기화되었습니다.", "info");
}

/**
 * CSV 다운로드
 */
function exportCurrentDataToCSV() {
  const list = getFilteredResearchList();
  if (list.length === 0) {
    showToast("내보낼 데이터가 없습니다.", "warning");
    return;
  }

  let csvContent = "\uFEFF";
  csvContent += "ID,성과유형,분야,제목,영문제목,연도,책임교수,소속연구실,특화센터,TRL,게재처/특허번호,DOI,핵심태그\n";

  list.forEach(item => {
    const row = [
      `"${item.id}"`,
      `"${getTypeMetadata(item.type).name}"`,
      `"${getCategoryMetadata(item.category).name}"`,
      `"${item.title.replace(/"/g, '""')}"`,
      `"${(item.titleEn || '').replace(/"/g, '""')}"`,
      item.year,
      `"${item.leadProfessor.replace(/"/g, '""')}"`,
      `"${item.lab.replace(/"/g, '""')}"`,
      `"${item.iccCenter.replace(/"/g, '""')}"`,
      item.trl,
      `"${(item.journal || item.patentNo || '').replace(/"/g, '""')}"`,
      `"${item.doi || ''}"`,
      `"${item.tags.join('; ')}"`
    ];
    csvContent += row.join(",") + "\n";
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const timestamp = new Date().toISOString().slice(0, 10);
  link.setAttribute("href", url);
  link.setAttribute("download", `한국공학대학교_연구성과_${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast(`총 ${list.length}건 CSV 다운로드 완료`, "success");
}

/**
 * 차트 초기화 (몬드리안 감성 그리드)
 */
function initCharts() {
  const annualCanvas = document.getElementById("chart-annual");
  const fieldCanvas = document.getElementById("chart-fields");

  if (!annualCanvas || !fieldCanvas || typeof Chart === "undefined") return;

  const isDark = AppState.darkMode;
  const textColor = isDark ? "#cbd5e1" : "#111827";
  const gridColor = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)";

  AppState.charts.annual = new Chart(annualCanvas, {
    type: "bar",
    data: {
      labels: CHART_ANNUAL_DATA.years,
      datasets: [
        {
          label: "국제논문(SCI급)",
          data: CHART_ANNUAL_DATA.papers,
          backgroundColor: "#003876", // 몬드리안 블루
          borderWidth: 2,
          borderColor: "#111827",
          order: 2
        },
        {
          label: "특허 등록",
          data: CHART_ANNUAL_DATA.patents,
          backgroundColor: "#f6bd60", // 몬드리안 옐로우
          borderWidth: 2,
          borderColor: "#111827",
          order: 2
        },
        {
          label: "기술이전 체결",
          data: CHART_ANNUAL_DATA.transfers,
          type: "line",
          borderColor: "#d90429", // 몬드리안 레드
          backgroundColor: "#d90429",
          borderWidth: 3,
          pointRadius: 5,
          pointBorderWidth: 2,
          pointBorderColor: "#111827",
          order: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: { color: textColor, font: { family: "Pretendard", weight: "bold" } }
        }
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { family: "Pretendard", weight: "bold" } }
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { family: "Pretendard" } }
        }
      }
    }
  });

  AppState.charts.field = new Chart(fieldCanvas, {
    type: "doughnut",
    data: {
      labels: CHART_FIELD_DATA.labels,
      datasets: [{
        data: CHART_FIELD_DATA.proportions,
        backgroundColor: [
          "#003876", // 몬드리안 블루 (반도체)
          "#d90429", // 몬드리안 레드 (AI)
          "#f6bd60", // 몬드리안 옐로우 (바이오)
          "#111827", // 몬드리안 블랙 (모빌리티)
          "#0284c7"  // 스카이 블루 (탄소중립)
        ],
        borderWidth: 3,
        borderColor: "#111827"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: textColor, font: { family: "Pretendard", weight: "bold" }, padding: 12 }
        }
      },
      cutout: "60%"
    }
  });
}

function refreshChartsTheme() {
  if (AppState.charts.annual && AppState.charts.field) {
    const isDark = AppState.darkMode;
    const textColor = isDark ? "#cbd5e1" : "#111827";
    const gridColor = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)";

    AppState.charts.annual.options.plugins.legend.labels.color = textColor;
    AppState.charts.annual.options.scales.x.grid.color = gridColor;
    AppState.charts.annual.options.scales.x.ticks.color = textColor;
    AppState.charts.annual.options.scales.y.grid.color = gridColor;
    AppState.charts.annual.options.scales.y.ticks.color = textColor;
    AppState.charts.annual.update();

    AppState.charts.field.options.plugins.legend.labels.color = textColor;
    AppState.charts.field.update();
  }
}

/**
 * 몬드리안 토스트 박스
 */
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  let bgClass = "bg-white text-slate-900";
  if (type === "success") bgClass = "bg-amber-300 text-slate-900";
  if (type === "warning") bgClass = "bg-red-500 text-white";

  toast.className = `toast ${bgClass}`;
  
  const iconName = type === "success" ? "check-circle" : (type === "warning" ? "alert-triangle" : "info");
  
  toast.innerHTML = `
    <i data-lucide="${iconName}" class="w-5 h-5 flex-shrink-0"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  if (window.lucide) lucide.createIcons();

  requestAnimationFrame(() => toast.classList.add("show"));

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 250);
  }, 3000);
}

/**
 * 보조 메타데이터 매핑
 */
function getTypeMetadata(type) {
  switch (type) {
    case "paper":
      return { name: "학술 논문", badgeClass: "m-block-blue" };
    case "patent":
      return { name: "특허 등록", badgeClass: "m-block-yellow" };
    case "transfer":
      return { name: "기술이전", badgeClass: "m-block-red" };
    case "grant":
      return { name: "대형 국책과제", badgeClass: "m-block-black" };
    default:
      return { name: "연구 성과", badgeClass: "bg-slate-800 text-white" };
  }
}

function getCategoryMetadata(category) {
  switch (category) {
    case "semiconductor": return { name: "차세대 반도체" };
    case "ai": return { name: "AI & 제조혁신(AX)" };
    case "bio": return { name: "바이오 & 신소재" };
    case "mobility": return { name: "첨단 모빌리티" };
    case "energy": return { name: "탄소중립 & 에너지" };
    default: return { name: "융합 연구" };
  }
}

function getTrlDescription(trl) {
  switch (trl) {
    case 1: return "기초 원리";
    case 2: return "개념 도출";
    case 3: return "실험실 검증(PoC)";
    case 4: return "시제품 검증";
    case 5: return "파일럿 검증";
    case 6: return "시스템 현장실증";
    case 7: return "운용환경 실증";
    case 8: return "시험인증 완료";
    case 9: return "양산 및 상용화";
    default: return "연구 진행 중";
  }
}

function setupKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeDetailModal();
      closeBookmarksModal();
      closeConsultationModal();
      closeSuccessModal();
    }
  });
}
