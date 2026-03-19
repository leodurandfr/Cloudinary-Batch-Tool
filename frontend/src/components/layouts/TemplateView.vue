<script setup>
import { computed, ref } from 'vue'
import { useCloudinary } from '@/composables/useCloudinary'

const { handleAfterError, buildTwoLayerUrl } = useCloudinary()

const props = defineProps({
  layout: { type: Object, required: true },
  refInfo: { type: Object, required: true },
  has3d: { type: Boolean, default: false }
})

function isPortee(type) {
  return /^portee(-\d+)?$/.test(type)
}

function getAspectRatio(item) {
  return isPortee(item.image.type) ? 0.6666666666666666 : 1
}

const coverUrl = computed(() => {
  if (!props.layout.cover) return ''
  const { image, layer1Chain, layer2Chain } = props.layout.cover
  return buildTwoLayerUrl(image, layer1Chain, layer2Chain, 1200)
})

function galleryHiRes(item) {
  return buildTwoLayerUrl(item.image, item.layer1Chain, item.layer2Chain, 1000)
}

const zoomUrl = computed(() => {
  if (!props.layout.zoom.visible) return ''
  const img = props.layout.zoom.image
  const l1 = props.layout.zoom.layer1Chain
  const l2 = props.layout.zoom.layer2Chain
  const base = 'https://www.chanel.com/images/'
  const l1Part = l1 ? `${l1}/` : ''
  const l2Part = l2 ? `${l2}/` : ''
  return `${base}t_one/${l1Part}${l2Part}c_fill,g_center,ar_1440:898,b_rgb:F9F9F9,q_auto:good,f_auto,fl_lossy/w_1440/${img.filename}`
})

const carouselRef = ref(null)
function scrollCarousel(dir) {
  const track = carouselRef.value
  if (!track) return
  // Scroll by exactly 1/3 of total scrollable width
  const scrollAmount = track.scrollWidth / 3
  track.scrollBy({ left: dir * scrollAmount })
}
</script>

<template>
  <div class="tpl-root">

    <!-- HEADER -->
    <header class="tpl-header">
      <div class="tpl-header__bar">
        <!-- Left: Menu -->
        <div class="tpl-header__side tpl-header__side--left">
          <button class="tpl-header__icon-btn" aria-label="Menu">
            <!-- Chanel-style menu: two thin lines -->
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><line x1="1" y1="7" x2="19" y2="7" stroke="currentColor" stroke-width="1"/><line x1="1" y1="13" x2="19" y2="13" stroke="currentColor" stroke-width="1"/></svg>
          </button>
        </div>

        <!-- Center: Logo -->
        <div class="tpl-header__logo">
          <svg xmlns="http://www.w3.org/2000/svg" width="175" height="28" viewBox="0 0 175 28" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="m20.655 17.726 4.565 2.615c-2.282 4.197-6.737 6.922-11.781 6.922C6.075 27.263 0 21.629 0 13.713S6.075.163 13.439.163c5.044 0 9.5 2.725 11.781 6.923L20.655 9.7c-1.326-2.725-4.013-4.381-7.216-4.381-4.603 0-8.1 3.423-8.1 8.394s3.497 8.395 8.1 8.395c3.203 0 5.89-1.657 7.216-4.382m29.05 8.874V15.554H36.818V26.6h-5.154V.826h5.154V10.4h12.887V.826h5.155V26.6zm29.898-10.678L74.926 5.061 70.25 15.922zM89.838 26.6h-5.634l-2.54-5.892H68.188l-2.54 5.892h-5.634L71.428.826h6.996zm23.748 0L99.778 6.313V26.6h-4.786V.826h6.812l11.598 17.084V.826h4.787V26.6zm14.543 0V.826h18.41v4.787h-13.624v5.523h11.782v4.786h-11.782v5.892h14.36V26.6zm27.431 0V.826h5.154v20.62h13.622V26.6z" clip-rule="evenodd"/></svg>
        </div>

        <!-- Right: Search, Wishlist, Cart -->
        <div class="tpl-header__side tpl-header__side--right">
          <!-- Search: thin magnifying glass -->
          <button class="tpl-header__icon-btn" aria-label="Rechercher">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="8.5" cy="8.5" r="6" stroke="currentColor" stroke-width="1"/><line x1="13" y1="13" x2="18" y2="18" stroke="currentColor" stroke-width="1"/></svg>
          </button>
          <!-- Wishlist: thin heart outline -->
          <button class="tpl-header__icon-btn" aria-label="Wishlist">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 17.5S2.5 12.5 2.5 7.5A3.75 3.75 0 0 1 10 6a3.75 3.75 0 0 1 7.5 1.5c0 5-7.5 10-7.5 10z" stroke="currentColor" stroke-width="1"/></svg>
          </button>
          <!-- Cart: thin shopping bag -->
          <button class="tpl-header__icon-btn" aria-label="Panier">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="7" width="14" height="11" rx="0.5" stroke="currentColor" stroke-width="1"/><path d="M7 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" stroke-width="1" fill="none"/></svg>
          </button>
        </div>
      </div>
    </header>

    <!-- HERO SECTION -->
    <section class="tpl-hero">
      <div class="tpl-hero__media">
        <div v-if="has3d && !layout.cover" class="tpl-hero__placeholder">
          Placeholder : Vue 3D
        </div>
        <img
          v-else-if="layout.cover"
          :src="coverUrl"
          :alt="refInfo.ref"
          class="tpl-hero__img"
          @error="handleAfterError($event, layout.cover.image.id)"
        />
        <div v-else class="tpl-hero__placeholder">Aucune image cover</div>
      </div>

      <div class="tpl-hero__content">
        <span class="tpl-hero__tag">Édition limitée</span>
        <h1 class="tpl-hero__title">{{ refInfo.ref }}</h1>
        <p class="tpl-hero__desc">Lorem ipsum dolor sit amet, consectetur adipiscing elit</p>
        <p class="tpl-hero__ref">Réf. {{ refInfo.ref }}</p>
        <p class="tpl-hero__price">14 900 €</p>
      </div>
    </section>

    <!-- PRODUCT INFORMATION -->
    <section class="tpl-info">
      <div class="tpl-info__inner">
        <h2 class="tpl-info__title">Informations du modèle</h2>
        <button class="tpl-info__more">
          <span class="tpl-info__more-text">Voir plus</span>
          <span class="tpl-info__more-icon">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><line x1="14" y1="20" x2="26" y2="20" stroke="currentColor" stroke-width="1"/><line x1="20" y1="14" x2="20" y2="26" stroke="currentColor" stroke-width="1"/></svg>
          </span>
        </button>
      </div>
    </section>

    <!-- ZOOM + GALLERY -->
    <section class="tpl-media">
      <!-- Zoom -->
      <div v-if="layout.zoom.visible" class="tpl-zoom">
        <img :src="zoomUrl" alt="" class="tpl-zoom__img" @error="handleAfterError($event, layout.zoom.image.id)" />
      </div>

      <!-- Gallery -->
      <template v-if="layout.gallery.items.length > 0">
        <!-- Simple mode (<=2) — exact Chanel cc-product-image-carousel structure -->
        <div
          v-if="layout.gallery.items.length <= 2"
          class="tpl-pic-carousel"
          style="--pic-mobile-height: 82cqw; --pic-desktop-height: 50cqw;"
        >
          <div class="tpl-pic-carousel__simple-wrapper">
            <div
              v-for="(item, i) in layout.gallery.items"
              :key="i"
              :class="isPortee(item.image.type)
                ? 'tpl-simple-portee'
                : 'tpl-simple-product'"
              :style="{ '--pic-aspect-ratio': getAspectRatio(item) }"
            >
              <img :src="galleryHiRes(item)" :alt="item.image.type" @error="handleAfterError($event, item.image.id)" />
            </div>
          </div>
        </div>

        <!-- Carousel mode (>2) — exact Chanel cc-product-image-carousel + cc-carousel -->
        <div
          v-else
          class="tpl-pic-carousel"
          style="--pic-mobile-height: 82cqw; --pic-desktop-height: 50cqw;"
        >
          <div class="tpl-pic-carousel__track" ref="carouselRef">
            <div
              v-for="(item, i) in layout.gallery.items"
              :key="i"
              class="tpl-pic-carousel__slide"
              :style="{ '--pic-aspect-ratio': getAspectRatio(item) }"
            >
              <img :src="galleryHiRes(item)" :alt="item.image.type" @error="handleAfterError($event, item.image.id)" />
            </div>
          </div>
          <div class="tpl-pic-carousel__nav">
            <button class="tpl-pic-carousel__btn" @click="scrollCarousel(-1)" aria-label="Précédent">
              <!-- Chanel chevron left: thin, 12×20 viewBox -->
              <svg width="12" height="20" viewBox="0 0 12 20" fill="none"><polyline points="10 2 2 10 10 18" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <button class="tpl-pic-carousel__btn" @click="scrollCarousel(1)" aria-label="Suivant">
              <svg width="12" height="20" viewBox="0 0 12 20" fill="none"><polyline points="2 2 10 10 2 18" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
        </div>
      </template>
    </section>

  </div>
</template>

<!-- Global font import (scoped @import doesn't work in Vue) -->
<style>
@import url('https://fonts.chanel.com/main.css');
@import url('https://fonts.chanel.com/xjf7bmk.css');
</style>

<style scoped>
/* ===================================================================
   Chanel PDP J12 — rebuilt from extracted computed styles
   =================================================================== */

.tpl-root {
  --c-primary: #1d1d1d;
  --c-body: #454545;
  --c-muted: #767676;
  --c-bg: #F9F9F9;
  --c-border: #d8d8d8;
  --ff: abchanel-2022, arial-adjusted-abchanel-2022, arial, helvetica, sans-serif;

  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  background: #fff;
  color: var(--c-primary);
  font-family: var(--ff);
  -webkit-font-smoothing: antialiased;
}
.tpl-root *, .tpl-root *::before, .tpl-root *::after { box-sizing: border-box; }

/* ===== HEADER ===== */
.tpl-header {
  border-top: 8px solid #000;
}
.tpl-header__bar {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  height: 75px; /* 4.6875rem = 75px */
}
.tpl-header__side {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 4px;
}
.tpl-header__side--left { left: 32px; }
.tpl-header__side--right { right: 32px; }
.tpl-header__logo {
  color: var(--c-primary);
  display: flex;
}
.tpl-header__icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--c-primary);
  padding: 0;
}

/* ===== HERO ===== */
.tpl-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 86px 0 36px; /* 5.375rem top, 2.25rem bottom */
  background-color: var(--c-bg);
}
@media (max-width: 960px) {
  .tpl-hero { padding: 70px 0 45px; }
}
@media (max-width: 600px) {
  .tpl-hero { padding: 60px 0 36px; }
}

.tpl-hero__media {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  width: 100%;
  height: 580px; /* 36.25rem */
  padding: 0 36px;
}
@media (max-width: 960px) {
  .tpl-hero__media { height: 500px; padding: 0; } /* 31.25rem */
}
@media (max-width: 600px) {
  .tpl-hero__media { height: 408px; padding: 0; } /* 25.5rem */
}

.tpl-hero__img {
  height: 100%;
  width: auto;
  object-fit: contain;
  object-position: top center;
}

.tpl-hero__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 14px;
  color: var(--c-muted);
  border: 2px dashed var(--c-border);
  border-radius: 4px;
}

/* Hero text content */
.tpl-hero__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 18px 265px 0; /* 1.125rem, 16.5625rem */
}
@media (max-width: 960px) {
  .tpl-hero__content { padding: 18px 108px 0; } /* 6.75rem */
}
@media (max-width: 600px) {
  .tpl-hero__content { padding: 18px 27px 0; } /* 1.6875rem */
}

.tpl-hero__tag {
  padding-bottom: 18px; /* 1.125rem */
  font-family: var(--ff);
  font-weight: 600;
  font-size: 12px;   /* 0.75rem */
  line-height: 16px; /* 1rem */
  letter-spacing: 0.7px; /* 0.04375rem */
  text-transform: uppercase;
}

.tpl-hero__title {
  font-family: var(--ff);
  font-weight: 600;
  color: var(--c-primary);
  text-align: center;
  text-transform: uppercase;
  word-break: keep-all;
  margin: 0;
  /* Desktop */
  max-width: 910px; /* 56.875rem */
  font-size: 58px;     /* 3.625rem */
  line-height: 63px;   /* 3.95125rem */
  letter-spacing: 3.5px; /* 0.2175rem */
}
@media (max-width: 960px) {
  .tpl-hero__title {
    max-width: 624px; /* 39rem */
    font-size: 46px;     /* 2.875rem */
    line-height: 50px;   /* 3.13375rem */
    letter-spacing: 2.8px;
  }
}
@media (max-width: 600px) {
  .tpl-hero__title {
    max-width: 339px; /* 21.1875rem */
    font-size: 32px;     /* 2rem */
    line-height: 40px;   /* 2.48rem */
    letter-spacing: 1.9px;
  }
}

.tpl-hero__desc {
  margin-top: 27px; /* 1.6875rem */
  font-family: var(--ff);
  font-size: 13px;   /* 0.8125rem */
  font-weight: 300;
  line-height: 20px; /* 1.25rem */
  color: var(--c-body);
}
@media (max-width: 600px) {
  .tpl-hero__desc { margin-top: 18px; }
}

.tpl-hero__ref {
  margin-top: 5px; /* 0.3125rem */
  font-family: var(--ff);
  font-size: 11px;   /* 0.6875rem */
  font-weight: 300;
  line-height: 17px; /* 1.0625rem */
  color: var(--c-muted);
}

.tpl-hero__price {
  margin-top: 9px; /* 0.5625rem */
  font-family: var(--ff);
  font-size: 13px;
  font-weight: 300;
  line-height: 20px;
  color: var(--c-body);
}

/* ===== PRODUCT INFORMATION ===== */
.tpl-info {
  display: flex;
  justify-content: center;
  width: 100%;
  background-color: var(--c-bg);
}
.tpl-info__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 9px; /* 0.5625rem */
  width: 100%;
  max-width: 732px; /* 45.75rem */
  padding: 0 27px 45px; /* 0 1.6875rem 2.8125rem */
}
@media (max-width: 960px) {
  .tpl-info__inner { max-width: 642px; } /* 40.125rem */
}

.tpl-info__title {
  width: fit-content;
  margin: 0;
  padding-top: 63px; /* 3.9375rem */
  font-family: var(--ff);
  font-weight: 600;
  text-transform: uppercase;
  color: var(--c-primary);
  border-top: 1px solid var(--c-border);
  /* cc-display-s — desktop 961+ */
  font-size: 25px;      /* 1.5625rem */
  line-height: 32px;    /* 2rem */
  letter-spacing: 1.5px; /* 0.09375rem */
}
@media (max-width: 960px) {
  .tpl-info__title {
    font-size: 20px;      /* 1.25rem */
    line-height: 26px;    /* 1.625rem */
    letter-spacing: 1.2px;
  }
}
@media (max-width: 600px) {
  .tpl-info__title {
    padding-top: 45px;
    font-size: 16px;      /* 1rem */
    line-height: 20px;    /* 1.25rem */
    letter-spacing: 1px;
  }
}

.tpl-info__more {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px; /* 1.125rem */
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
}
.tpl-info__more-text {
  font-family: var(--ff);
  font-size: 13px;
  font-weight: 300;
  line-height: 20px;
  color: var(--c-body);
}
.tpl-info__more-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: var(--c-primary);
}

/* ===== ZOOM + GALLERY ===== */
.tpl-media {
  display: flex;
  flex-direction: column;
  gap: 5px; /* 0.3125rem */
  width: 100%;
  margin-top: 5px;
  /* Container queries: gallery dimensions relative to this container, not viewport */
  container-type: inline-size;
}

.tpl-zoom__img {
  width: 100%;
  display: block;
  aspect-ratio: 1440 / 898;
  object-fit: cover;
  object-position: center;
  background-color: var(--c-bg);
}

/* ======================================================================
   GALLERY — mirrors exact Chanel .cc-product-image-carousel structure
   Uses same CSS custom properties: --pic-mobile-height-vw, --pic-desktop-height-vw, --pic-aspect-ratio
   ====================================================================== */
.tpl-pic-carousel {
  width: 100%;
  margin-bottom: 27px; /* 1.6875rem */
}

/* --- SIMPLE MODE (≤2 images) --- */
.tpl-pic-carousel__simple-wrapper {
  display: flex;
  gap: 5px;            /* 0.3125rem */
  align-items: center;
  justify-content: center;
}

/* Portée slide: fixed width from aspect-ratio × height, flex-shrink 0 */
.tpl-simple-portee {
  flex-shrink: 0;
  height: var(--pic-mobile-height);
  width: calc(var(--pic-mobile-height) * var(--pic-aspect-ratio, 0.666));
  background-color: var(--c-bg);
}
@media (min-width: 601px) {
  .tpl-simple-portee {
    height: var(--pic-desktop-height);
    width: calc(var(--pic-desktop-height) * var(--pic-aspect-ratio, 0.666));
  }
}
.tpl-simple-portee img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
}

/* Product (not-worn) slide: flex-1, centers inner image */
.tpl-simple-product {
  display: flex;
  flex: 1 1 0%;
  align-items: center;
  justify-content: center;
  height: var(--pic-mobile-height);
  background-color: var(--c-bg);
}
@media (min-width: 601px) {
  .tpl-simple-product {
    height: var(--pic-desktop-height);
  }
}
.tpl-simple-product img {
  width: calc(var(--pic-desktop-height) * var(--pic-aspect-ratio, 1));
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
}
@media (max-width: 600px) {
  .tpl-simple-product img {
    width: calc(var(--pic-mobile-height) * var(--pic-aspect-ratio, 1));
  }
}

/* --- CAROUSEL MODE (>2 images) --- */
.tpl-pic-carousel__track {
  display: flex;
  gap: 5px;          /* 0.3125rem */
  padding: 0;
  overflow-x: auto;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  align-items: flex-end;
}
.tpl-pic-carousel__track::-webkit-scrollbar { display: none; }

.tpl-pic-carousel__slide {
  flex-shrink: 0;
  scroll-snap-align: center;
  background-color: var(--c-bg);
  /* Exact Chanel formula: width = height * aspect-ratio */
  width: calc(var(--pic-mobile-height) * var(--pic-aspect-ratio, 1));
  min-width: calc(347px * var(--pic-aspect-ratio, 1)); /* 21.6875rem */
  height: var(--pic-mobile-height);
  min-height: 347px;
}
@media (min-width: 601px) {
  .tpl-pic-carousel__slide {
    width: calc(var(--pic-desktop-height) * var(--pic-aspect-ratio, 1));
    height: var(--pic-desktop-height);
  }
}

.tpl-pic-carousel__slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
}

/* --- Carousel navigation arrows (Chanel: plain chevrons, no circle) --- */
.tpl-pic-carousel__nav {
  display: flex;
  gap: 18px;          /* 1.125rem */
  align-items: center;
  justify-content: center;
  margin-top: 27px;   /* 1.6875rem */
}
.tpl-pic-carousel__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--c-primary);
  padding: 0;
  transition: color 0.2s;
}
.tpl-pic-carousel__btn:hover {
  color: var(--c-muted);
}
.tpl-pic-carousel__btn[disabled] {
  color: #949494;
  cursor: default;
}
</style>
