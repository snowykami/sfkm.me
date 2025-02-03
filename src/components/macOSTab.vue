<template>
    <div class="macos-tab" @mousedown="startDrag">
        <div class="dots">
            <div class="dot red" @click="closeWindow">
                <span class="icon">✕</span>
            </div>
            <div class="dot yellow" @click="toggleVisibility">
                <span class="icon">=</span>
            </div>
            <div class="dot green" @click="maximizeWindow">
                <span class="icon">⇕</span>
            </div>
        </div>
        <div class="title">{{getText('title')}}</div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { getText } from '../utils/i18n';

const lastWidth = ref(0);
const lastHeight = ref(0);

const lastX = ref(0);
const lastY = ref(0);

const isMaximized = ref(false);
const isVisible = ref(true);

function closeWindow() {
    const homeElement = document.getElementById('home-window');
    if (homeElement) {
        homeElement.style.display = 'none';
    }
}

function toggleVisibility() {
    isVisible.value = !isVisible.value;
    const homeElement = document.getElementById('home');
    if (homeElement) {
        homeElement.style.display = isVisible.value ? 'flex' : 'none';
    }
}

function maximizeWindow() {
    
    // 储存放大前的宽高
    const homeElement = document.getElementById('home-window');
    if(!homeElement) return;
    if (isMaximized.value) {
        homeElement.style.width = `${lastWidth.value}px`;
        homeElement.style.height = `${lastHeight.value}px`;
        homeElement.style.left = `${lastX.value}px`;
        homeElement.style.top = `${lastY.value}px`;
    } else {
        lastWidth.value = homeElement?.clientWidth || 0;
        lastHeight.value = homeElement?.clientHeight || 0;
        lastX.value = homeElement?.getBoundingClientRect().left || 0;
        lastY.value = homeElement?.getBoundingClientRect().top || 0;
        homeElement.style.width = '100%';
        homeElement.style.height = '100%';
        homeElement.style.left = '0';
        homeElement.style.top = '0';
    }
    isMaximized.value = !isMaximized.value;
}

function startDrag(event: MouseEvent) {
    const homeElement = document.getElementById('home-window') as HTMLElement | null;
    if (!homeElement) return;

    const rect = homeElement.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    let isDragging = true;
    document.body.style.userSelect = 'none'; // 禁用文本选择

    function onMouseMove(e: MouseEvent) {
        if (!isDragging) return;
        if (!homeElement) return; // 再次检查homeElement是否为null
        requestAnimationFrame(() => {
            homeElement.style.position = 'absolute';
            homeElement.style.left = `${e.clientX - offsetX}px`;
            homeElement.style.top = `${e.clientY - offsetY}px`;
        });
    }

    function onMouseUp() {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.body.style.userSelect = ''; // 恢复文本选择
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}
</script>

<style scoped>
.macos-tab {
    display: flex;
    align-items: center;
    padding: 0.5rem;
    background-color: #b4dbff;
    border-radius: 10px 10px 0 0;
    width: 100%;
    box-sizing: border-box;
    cursor: grab;
    position: relative;
}

.macos-tab:active {
    cursor: grabbing;
}

.dots {
    display: flex;
    align-items: center;
    justify-content: center;
}

.dot {
    position: relative;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    margin-right: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

.dot .icon {
    opacity: 0;
    visibility: hidden;
    position: absolute;
    font-size: 10px;
    color: rgb(0, 0, 0);
    transition: opacity 0.2s, visibility 0.2s;
}

.dot:hover .icon {
    opacity: 1;
    visibility: visible;
}


.red {
    background-color: #ff5f56;
}

.yellow {
    background-color: #ffbd2e;
}

.green {
    background-color: #27c93f;
}

.title {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    font-size: 14px;
    font-weight: bold;
    color: #333;
}

/* 移动端不显示此组件 */
@media (max-width: 768px) {
    .macos-tab {
        display: none;
    }
}
</style>