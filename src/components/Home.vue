<template>
    <div id="home-window" class="resizable">
        <div class="resize-handle top-left" @mousedown="startResize('top-left', $event)"></div>
        <div class="resize-handle top-right" @mousedown="startResize('top-right', $event)"></div>
        <macOSTab />
        <div id="home" class="container ui">
            <!-- 新增 home 四边的缩放手柄 -->
            <div class="resize-handle top" @mousedown="startResizeHome('top', $event)"></div>
            <div class="resize-handle right" @mousedown="startResizeHome('right', $event)"></div>
            <div class="resize-handle bottom" @mousedown="startResizeHome('bottom', $event)"></div>
            <div class="resize-handle left" @mousedown="startResizeHome('left', $event)"></div>
            <div class="resize-handle bottom-left" @mousedown="startResize('bottom-left', $event)"></div>
            <div class="resize-handle bottom-right" @mousedown="startResize('bottom-right', $event)"></div>
            <Left />
            <Right />
        </div>
        <LanguageSwitcher />
        <footer>
            <p>© {{ new Date().getFullYear() }} Snowykami. All rights reserved.</p>
        </footer>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Left from './Left.vue';
import Right from './Right.vue';
import LanguageSwitcher from './LanguageSwitcher.vue';
import macOSTab from './macOSTab.vue';

const resizing = ref(false);
const resizeDirection = ref('');
const startX = ref(0);
const startY = ref(0);
const startWidth = ref(0);
const startHeight = ref(0);

function startResize(direction: string, event: MouseEvent) {
    resizing.value = true;
    resizeDirection.value = direction;
    startX.value = event.clientX;
    startY.value = event.clientY;
    const homeElement = document.getElementById('home-window');
    if (homeElement) {
        startWidth.value = homeElement.offsetWidth;
        startHeight.value = homeElement.offsetHeight;
    }
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResize);
}

function resize(event: MouseEvent) {
    if (!resizing.value) return;
    const homeElement = document.getElementById('home-window');
    if (!homeElement) return;

    const dx = event.clientX - startX.value;
    const dy = event.clientY - startY.value;

    if (resizeDirection.value.includes('right')) {
        homeElement.style.width = `${startWidth.value + dx}px`;
    }
    if (resizeDirection.value.includes('bottom')) {
        homeElement.style.height = `${startHeight.value + dy}px`;
    }
    if (resizeDirection.value.includes('left')) {
        homeElement.style.width = `${startWidth.value - dx}px`;
        homeElement.style.left = `${homeElement.offsetLeft + dx}px`;
    }
    if (resizeDirection.value.includes('top')) {
        homeElement.style.height = `${startHeight.value - dy}px`;
        homeElement.style.top = `${homeElement.offsetTop + dy}px`;
    }
}

function stopResize() {
    resizing.value = false;
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResize);
}

// ----- 新增：home 缩放逻辑 -----
const resizingHome = ref(false);
const resizeHomeDirection = ref('');
const startXHome = ref(0);
const startYHome = ref(0);
const startWidthHome = ref(0);
const startHeightHome = ref(0);

function startResizeHome(direction: string, event: MouseEvent) {
    resizingHome.value = true;
    resizeHomeDirection.value = direction;
    startXHome.value = event.clientX;
    startYHome.value = event.clientY;
    const home = document.getElementById('home');
    if (home) {
        startWidthHome.value = home.offsetWidth;
        startHeightHome.value = home.offsetHeight;
    }
    document.addEventListener('mousemove', resizeHome);
    document.addEventListener('mouseup', stopResizeHome);
}

function resizeHome(event: MouseEvent) {
    if (!resizingHome.value) return;
    const home = document.getElementById('home');
    if (!home) return;

    const dx = event.clientX - startXHome.value;
    const dy = event.clientY - startYHome.value;

    if (resizeHomeDirection.value === 'right') {
        home.style.width = `${startWidthHome.value + dx}px`;
    }
    if (resizeHomeDirection.value === 'bottom') {
        home.style.height = `${startHeightHome.value + dy}px`;
    }
    if (resizeHomeDirection.value === 'left') {
        home.style.width = `${startWidthHome.value - dx}px`;
        home.style.left = `${home.offsetLeft + dx}px`;
    }
    if (resizeHomeDirection.value === 'top') {
        home.style.height = `${startHeightHome.value - dy}px`;
        home.style.top = `${home.offsetTop + dy}px`;
    }
}

function stopResizeHome() {
    resizingHome.value = false;
    document.removeEventListener('mousemove', resizeHome);
    document.removeEventListener('mouseup', stopResizeHome);
}
</script>

<style scoped>
#home {
    background-color: rgba(0, 0, 0, 0.3);
    display: flex;
    justify-content: center;
    align-items: flex-start;
    height: 100%;
    position: relative;
}

/* 扩展：新增 home 四边缩放手柄样式 */
.resize-handle.top {
    top: -5px;
    left: 50%;
    transform: translateX(-50%);
    cursor: ns-resize;
}
.resize-handle.bottom {
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%);
    cursor: ns-resize;
}
.resize-handle.left {
    left: -5px;
    top: 50%;
    transform: translateY(-50%);
    cursor: ew-resize;
}
.resize-handle.right {
    right: -5px;
    top: 50%;
    transform: translateY(-50%);
    cursor: ew-resize;
}

/* 原有手柄样式 */
.resize-handle {
    position: absolute;
    width: 10px;
    height: 10px;
    background: transparent;
    z-index: 10;
}

.resize-handle.top-left {
    top: 0;
    left: 0;
    cursor: nwse-resize;
}

.resize-handle.top-right {
    top: 0;
    right: 0;
    cursor: nesw-resize;
}

.resize-handle.bottom-left {
    bottom: 0;
    left: 0;
    cursor: nesw-resize;
}

.resize-handle.bottom-right {
    bottom: 0;
    right: 0;
    cursor: nwse-resize;
}

@media (min-width: 769px) {
    #left {
        width: 20vw;
        max-width: 200px;
    }

    #right {
        width: 60vw;
        max-width: 600px;
    }

    #home {
        border-top-left-radius: 0;
        border-top-right-radius: 0;
        
    }
}

/* 移动端样式 */
@media (max-width: 768px) {
    #home {
        flex-direction: column;
        align-items: center;
    }

    #left, #right {
        width: 80vw;
    }
}
</style>