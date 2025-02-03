<template>
    <div class="language-switcher">
        <label for="language-select">选择语言 / Select Language:</label>
        <select id="language-select" v-model="selectedLang" @change="switchLanguage">
            <option v-for="(name, code) in languages" :key="code" :value="code">
                {{ name }}
            </option>
        </select>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getLangs, setLang } from '../utils/i18n';

const languages = ref<Record<string, string>>({});
const selectedLang = ref<string>('zh-CN');

onMounted(() => {
    languages.value = getLangs();
    selectedLang.value = localStorage.getItem('lang') || 'zh-CN';
});

function switchLanguage() {
    setLang(selectedLang.value);
    localStorage.setItem('lang', selectedLang.value);
}
</script>

<style scoped>
.language-switcher {
    margin: 1em 0;
    text-align: center;
}

label {
    margin-right: 0.5em;
    color: white;
}

select {
    padding: 0.2em 0.5em;
    font-size: 0.8em;
    border-radius: 5em;
}
</style>