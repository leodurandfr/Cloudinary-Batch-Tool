<script setup>
import { computed, ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useCloudinary } from '@/composables/useCloudinary'

const { buildTwoLayerUrl, onImgError } = useCloudinary()

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
  const { image, layer1Chain, layer2Chain } = props.layout.zoom
  return buildTwoLayerUrl(image, layer1Chain, layer2Chain, 1440)
})

const carouselRef = ref(null)
const atStart = ref(true)
const atEnd = ref(false)

function updateScrollState() {
  const track = carouselRef.value
  if (!track) return
  atStart.value = track.scrollLeft <= 1
  atEnd.value = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1
}

function scrollCarousel(dir) {
  const track = carouselRef.value
  if (!track) return
  const scrollAmount = track.scrollWidth / 3
  track.scrollBy({ left: dir * scrollAmount })
}

watch(carouselRef, (el) => {
  if (el) {
    el.addEventListener('scroll', updateScrollState, { passive: true })
    nextTick(updateScrollState)
  }
})

onBeforeUnmount(() => {
  carouselRef.value?.removeEventListener('scroll', updateScrollState)
})
</script>

<template>
  <div class="tpl-root">

    <!-- HEADER -->
    <header class="tpl-header">
      <div class="tpl-header__bar">
        <!-- Left: empty (burger removed) -->
        <div class="tpl-header__side tpl-header__side--left"></div>

        <!-- Center: Logo -->
        <div class="tpl-header__logo">
          <svg xmlns="http://www.w3.org/2000/svg" width="175" height="28" viewBox="0 0 175 28" aria-hidden="true">
            <path fill="currentColor" fill-rule="evenodd"
              d="m20.655 17.726 4.565 2.615c-2.282 4.197-6.737 6.922-11.781 6.922C6.075 27.263 0 21.629 0 13.713S6.075.163 13.439.163c5.044 0 9.5 2.725 11.781 6.923L20.655 9.7c-1.326-2.725-4.013-4.381-7.216-4.381-4.603 0-8.1 3.423-8.1 8.394s3.497 8.395 8.1 8.395c3.203 0 5.89-1.657 7.216-4.382m29.05 8.874V15.554H36.818V26.6h-5.154V.826h5.154V10.4h12.887V.826h5.155V26.6zm29.898-10.678L74.926 5.061 70.25 15.922zM89.838 26.6h-5.634l-2.54-5.892H68.188l-2.54 5.892h-5.634L71.428.826h6.996zm23.748 0L99.778 6.313V26.6h-4.786V.826h6.812l11.598 17.084V.826h4.787V26.6zm14.543 0V.826h18.41v4.787h-13.624v5.523h11.782v4.786h-11.782v5.892h14.36V26.6zm27.431 0V.826h5.154v20.62h13.622V26.6z"
              clip-rule="evenodd" />
          </svg>
        </div>

        <!-- Right: Search, Account, Wishlist, Cart -->
        <div class="tpl-header__side tpl-header__side--right">
          <button class="tpl-header__icon-btn" aria-label="Rechercher">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24"
              aria-hidden="true">
              <path fill="currentColor" fill-rule="evenodd"
                d="M15.703 16.61a8 8 0 1 1 .948-1.163l5.331 4.479-.964 1.148zM16.5 11a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0"
                clip-rule="evenodd"></path>
            </svg>
          </button>
          <button class="tpl-header__icon-btn" aria-label="Compte">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24"
              aria-hidden="true">
              <path fill="currentColor" fill-rule="evenodd"
                d="M17 7A5 5 0 1 1 7 7a5 5 0 0 1 10 0m-1.5 0a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0" clip-rule="evenodd">
              </path>
              <path fill="currentColor"
                d="M4.814 20.93a7.575 7.575 0 0 1 14.372 0l.353 1.057 1.423-.474-.353-1.058a9.075 9.075 0 0 0-17.218 0l-.352 1.058 1.423.474z">
              </path>
            </svg>
          </button>
          <button class="tpl-header__icon-btn" aria-label="Wishlist">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24"
              aria-hidden="true">
              <path fill="currentColor" fill-rule="evenodd"
                d="M15.233 8.55 12 2 8.767 8.55 1.538 9.6l5.231 5.1-1.235 7.2L12 18.5l6.466 3.4-1.235-7.2 5.23-5.1zm4.005 2.098-5.001-.727L12 5.39 9.763 9.921l-5.001.727 3.619 3.528-.854 4.981L12 16.805l4.473 2.352-.854-4.981z"
                clip-rule="evenodd"></path>
            </svg>
          </button>
          <button class="tpl-header__icon-btn" aria-label="Panier">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24"
              aria-hidden="true">
              <path fill="currentColor" fill-rule="evenodd"
                d="M12 2.25A3.75 3.75 0 0 0 8.25 6v1H3v15h18V7h-5.25V6A3.75 3.75 0 0 0 12 2.25m2.25 6.25V12h1.5V8.5h3.75v12h-15v-12h3.75V12h1.5V8.5zm0-1.5V6a2.25 2.25 0 0 0-4.5 0v1z"
                clip-rule="evenodd"></path>
            </svg>
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
        <img v-else-if="layout.cover" :src="coverUrl" :alt="refInfo.ref" class="tpl-hero__img" @error="onImgError" />
        <div v-else class="tpl-hero__placeholder">Aucune image cover</div>
      </div>

      <div class="tpl-hero__content">
        <span class="tpl-hero__tag">Édition limitée</span>
        <h1 class="tpl-hero__title">{{ refInfo.ref }}</h1>
        <p class="tpl-hero__desc">Lorem ipsum dolor sit amet, consectetur adipiscing elit</p>
        <p class="tpl-hero__ref">Réf. {{ refInfo.ref }}</p>
        <p class="tpl-hero__price">14 900 €</p>
        <button class="tpl-hero__wishlist" aria-label="Ajouter aux favoris">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="none" stroke="currentColor"
            viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="m12 5.695 1.679 3.4.174.354.39.057 3.754.546-2.716 2.647-.283.275.067.389.641 3.738-3.357-1.765-.349-.183-.349.183-3.357 1.765.641-3.738.067-.389-.283-.275-2.716-2.647 3.754-.546.39-.057.174-.353z">
            </path>
          </svg>
        </button>
      </div>
    </section>

    <!-- PRODUCT INFORMATION -->
    <section class="tpl-info">
      <div class="tpl-info__inner">
        <h2 class="tpl-info__title">Informations du modèle</h2>
        <button class="tpl-info__more">
          <span class="tpl-info__more-text">Voir plus</span>
          <span class="tpl-info__more-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="none" viewBox="0 0 24 24"
              aria-hidden="true">
              <path fill="currentColor" fill-rule="evenodd"
                d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16m-.75-12v3.25H8v1.5h3.25V16h1.5v-3.25H16v-1.5h-3.25V8z"
                clip-rule="evenodd"></path>
            </svg>
          </span>
        </button>
      </div>
    </section>

    <!-- ZOOM + GALLERY -->
    <section class="tpl-media">
      <!-- Zoom -->
      <div v-if="layout.zoom.visible" class="tpl-zoom">
        <img :src="zoomUrl" alt="" class="tpl-zoom__img" @error="onImgError" />
      </div>

      <!-- Gallery -->
      <template v-if="layout.gallery.items.length > 0">
        <!-- Simple mode (<=2) — exact Chanel cc-product-image-carousel structure -->
        <div v-if="layout.gallery.items.length <= 2" class="tpl-pic-carousel"
          style="--pic-mobile-height: 82cqw; --pic-desktop-height: 50cqw;">
          <div class="tpl-pic-carousel__simple-wrapper">
            <div v-for="(item, i) in layout.gallery.items" :key="i" :class="isPortee(item.image.type)
              ? 'tpl-simple-portee'
              : 'tpl-simple-product'" :style="{ '--pic-aspect-ratio': getAspectRatio(item) }">
              <img :src="galleryHiRes(item)" :alt="item.image.type" @error="onImgError" />
            </div>
          </div>
        </div>

        <!-- Carousel mode (>2) — exact Chanel cc-product-image-carousel + cc-carousel -->
        <div v-else class="tpl-pic-carousel" style="--pic-mobile-height: 82cqw; --pic-desktop-height: 50cqw;">
          <div class="tpl-pic-carousel__track" ref="carouselRef">
            <div v-for="(item, i) in layout.gallery.items" :key="i" class="tpl-pic-carousel__slide"
              :style="{ '--pic-aspect-ratio': getAspectRatio(item) }">
              <img :src="galleryHiRes(item)" :alt="item.image.type" @error="onImgError" />
            </div>
          </div>
          <div class="tpl-pic-carousel__nav">
            <button class="tpl-pic-carousel__btn" :disabled="atStart" @click="scrollCarousel(-1)" aria-label="Précédent">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" aria-hidden="true" style="transform: rotate(180deg)">
                <path fill="currentColor" fill-rule="evenodd" d="M10.53 5.47 9.47 6.53 14.94 12l-5.47 5.47 1.06 1.06L17.06 12z" clip-rule="evenodd"></path>
              </svg>
            </button>
            <button class="tpl-pic-carousel__btn" :disabled="atEnd" @click="scrollCarousel(1)" aria-label="Suivant">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" fill-rule="evenodd" d="M10.53 5.47 9.47 6.53 14.94 12l-5.47 5.47 1.06 1.06L17.06 12z" clip-rule="evenodd"></path>
              </svg>
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
  margin: 0 auto;
  background: #fff;
  color: var(--c-primary);
  font-family: var(--ff);
  -webkit-font-smoothing: antialiased;
}

.tpl-root *,
.tpl-root *::before,
.tpl-root *::after {
  box-sizing: border-box;
}

/* ===== HEADER ===== */
.tpl-header {
  background-color: var(--c-bg);
  padding-top: 8px;
}

.tpl-header__bar {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  /* height: 79px;  */
  padding-top: 30px;
  padding-bottom: 20px;

}

.tpl-header__side {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 4px;
}

.tpl-header__side--left {
  left: 8%;
}

.tpl-header__side--right {
  right: 8%;
}

.tpl-header__logo {
  color: var(--c-primary);
  display: flex;
}

.tpl-header__icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
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
  padding: 0 0 36px;
  /* 2.25rem bottom */
  background-color: var(--c-bg);
}

@media (max-width: 960px) {
  .tpl-hero {
    padding: 0 0 45px;
  }
}

@media (max-width: 600px) {
  .tpl-hero {
    padding: 0 0 36px;
  }
}

.tpl-hero__media {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  width: 100%;
  height: 580px;
  /* 36.25rem */
  padding: 0 36px;
  background-color: var(--c-bg);
}

@media (max-width: 960px) {
  .tpl-hero__media {
    height: 500px;
    padding: 0;
  }

  /* 31.25rem */
}

@media (max-width: 600px) {
  .tpl-hero__media {
    height: 408px;
    padding: 0;
  }

  /* 25.5rem */
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
  padding: 36px 265px 0;
  /* 1.125rem, 16.5625rem */
}

@media (max-width: 960px) {
  .tpl-hero__content {
    padding: 18px 108px 0;
  }

  /* 6.75rem */
}

@media (max-width: 600px) {
  .tpl-hero__content {
    padding: 18px 27px 0;
  }

  /* 1.6875rem */
}

.tpl-hero__tag {
  padding-bottom: 18px;
  /* 1.125rem */
  font-family: var(--ff);
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0.7px;
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
  max-width: 910px;
  /* 56.875rem */
  font-size: 58px;
  /* 3.625rem */
  line-height: 63px;
  /* 3.95125rem */
  letter-spacing: 3.5px;
  /* 0.2175rem */
}

@media (max-width: 960px) {
  .tpl-hero__title {
    max-width: 624px;
    /* 39rem */
    font-size: 46px;
    /* 2.875rem */
    line-height: 50px;
    /* 3.13375rem */
    letter-spacing: 2.8px;
  }
}

@media (max-width: 600px) {
  .tpl-hero__title {
    max-width: 339px;
    /* 21.1875rem */
    font-size: 32px;
    /* 2rem */
    line-height: 40px;
    /* 2.48rem */
    letter-spacing: 1.9px;
  }
}

.tpl-hero__desc {
  margin-top: 27px;
  /* 1.6875rem */
  font-family: var(--ff);
  font-size: 14px;
  font-weight: 300;
  line-height: 22px;
  color: var(--c-body);
}

@media (max-width: 600px) {
  .tpl-hero__desc {
    margin-top: 18px;
  }
}

.tpl-hero__ref {
  margin-top: 5px;
  /* 0.3125rem */
  font-family: var(--ff);
  font-size: 11px;
  /* 0.6875rem */
  font-weight: 300;
  line-height: 17px;
  /* 1.0625rem */
  color: var(--c-muted);
}

.tpl-hero__price {
  margin-top: 9px;
  /* 0.5625rem */
  font-family: var(--ff);
  font-size: 20px;
  font-weight: 600;
  line-height: 26px;
  color: rgb(69, 69, 69);
}

.tpl-hero__wishlist {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 18px;
  width: 36px;
  height: 36px;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--c-primary);
  padding: 0;
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
  gap: 9px;
  /* 0.5625rem */
  width: 100%;
  max-width: 732px;
  /* 45.75rem */
  padding: 0 27px 45px;
  /* 0 1.6875rem 2.8125rem */
}

@media (max-width: 960px) {
  .tpl-info__inner {
    max-width: 642px;
  }

  /* 40.125rem */
}

.tpl-info__title {
  width: fit-content;
  margin: 0;
  padding-top: 63px;
  /* 3.9375rem */
  font-family: var(--ff);
  font-weight: 600;
  text-transform: uppercase;
  color: var(--c-primary);
  border-top: 1px solid var(--c-border);
  /* cc-display-s — desktop 961+ */
  font-size: 25px;
  /* 1.5625rem */
  line-height: 32px;
  /* 2rem */
  letter-spacing: 1.5px;
  /* 0.09375rem */
}

@media (max-width: 960px) {
  .tpl-info__title {
    font-size: 20px;
    /* 1.25rem */
    line-height: 26px;
    /* 1.625rem */
    letter-spacing: 1.2px;
  }
}

@media (max-width: 600px) {
  .tpl-info__title {
    padding-top: 45px;
    font-size: 16px;
    /* 1rem */
    line-height: 20px;
    /* 1.25rem */
    letter-spacing: 1px;
  }
}

.tpl-info__more {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  /* 1.125rem */
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
  width: 36px;
  height: 36px;
  color: var(--c-primary);
}

/* ===== ZOOM + GALLERY ===== */
.tpl-media {
  display: flex;
  flex-direction: column;
  gap: 5px;
  /* 0.3125rem */
  width: 100%;
  margin-top: 5px;
  /* Container queries: gallery dimensions relative to this container, not viewport */
  container-type: inline-size;
}

.tpl-zoom {
  background-color: var(--c-bg);
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
  margin-bottom: 27px;
  /* 1.6875rem */
}

/* --- SIMPLE MODE (≤2 images) --- */
.tpl-pic-carousel__simple-wrapper {
  display: flex;
  gap: 5px;
  /* 0.3125rem */
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
  gap: 5px;
  /* 0.3125rem */
  padding: 0;
  overflow-x: auto;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  align-items: flex-end;
}

.tpl-pic-carousel__track::-webkit-scrollbar {
  display: none;
}

.tpl-pic-carousel__slide {
  flex-shrink: 0;
  scroll-snap-align: center;
  background-color: var(--c-bg);
  /* Exact Chanel formula: width = height * aspect-ratio */
  width: calc(var(--pic-mobile-height) * var(--pic-aspect-ratio, 1));
  min-width: calc(347px * var(--pic-aspect-ratio, 1));
  /* 21.6875rem */
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
  gap: 18px;
  /* 1.125rem */
  align-items: center;
  justify-content: center;
  margin-top: 27px;
  /* 1.6875rem */
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
  color: #c6c6c6;
  cursor: default;
}
</style>
