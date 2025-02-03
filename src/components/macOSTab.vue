<template>
    <div class="macos-tab" @mousedown="startDrag">
        <div class="dots">
            <div class="dot red" @click="closeWindow">
                <span class="icon">✕</span>
            </div>
            <div class="dot yellow" @click="toggleVisibility">
                <span class="icon">━</span>
            </div>
            <div class="dot green" @click="maximizeWindow">
                <span class="icon">⤢</span>
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
        homeElement.style.display = isVisible.value ? 'block' : 'none';
    }
}

function maximizeWindow() {
    const homeElement = document.getElementById('home-window');
    // 储存上一次的宽高
    if (lastWidth.value === 0) {
        lastWidth.value = homeElement?.clientWidth || 0;
        lastHeight.value = homeElement?.clientHeight || 0;
    }
    // 若当前窗口已经是最大化状态，则恢复
    if (homeElement?.clientWidth === window.innerWidth && homeElement?.clientHeight === window.innerHeight) {
        homeElement.style.width = `${lastWidth.value}px`;
        homeElement.style.height = `${lastHeight.value}px`;
        return;
    } else {
        if (!homeElement) return;
        homeElement.style.width = '100vw';
        homeElement.style.height = '100vh';
    }
}

function startDrag(event: MouseEvent) {
    const homeElement = document.getElementById('home-window') as HTMLElement | null;
    if (!homeElement) return;

    const rect = homeElement.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    let isDragging = true;

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
    color: white;
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
</style>