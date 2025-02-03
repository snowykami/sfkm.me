<template>
    <div class="container" id="readme">
        <div class="react-ui size" id="first-sentence" ref="firstSentence">
            <h2>Loading...</h2>
        </div>
        <p class="react-ui size">💻 {{ getText('p1') }}</p>
        <p class="react-ui size">🏢 {{ getText('p2') }}</p>
        <p class="react-ui size">🏠 {{ getText('p3') }}</p>
        <p class="react-ui size">🎮 {{ getText('p4') }}</p>
        <p class="react-ui size"></p>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { getText } from '../utils/i18n';

const firstSentence = ref<HTMLElement | null>(null);

const sentences = [
    getText('h1'),
    getText('h2')
];

onMounted(() => {
    let index = 0;

    function showNextSentence() {
        if (firstSentence.value) {
            firstSentence.value.classList.remove('visible');
            firstSentence.value.classList.add('hidden');
            setTimeout(() => {
                firstSentence.value!.innerHTML = sentences[index].value;
                firstSentence.value!.classList.remove('hidden');
                firstSentence.value!.classList.add('visible');
                index = (index + 1) % sentences.length;
            }, 500); // 与CSS过渡时间匹配
        }
    }

    showNextSentence();
    setInterval(showNextSentence, 3500); // 3000ms + 500ms 过渡时间
});
</script>

<style lang="css">
#first-sentence {
    text-align: center;
    font-weight: bold;
    width: 100%;
}

#readme {
    /* 默认靠左 */
    text-align: left;
    width: 100%;
    box-sizing: border-box;
    /* 包括内边距和边框在内的宽度计算 */
}

#nickname {
    background: linear-gradient(45deg, #6ebbff, #f573ea);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-family: 'Playball', cursive;
}

.hidden {
    opacity: 0;
    transition: opacity 0.5s ease-in-out;
}

.visible {
    opacity: 1;
    transition: opacity 0.5s ease-in-out;
}
</style>