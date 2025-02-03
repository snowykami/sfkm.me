<template>
    <div class="container" id="left">
        <img class="avatar react-ui rotate" src="https://q.qlogo.cn/g?b=qq&nk=2751454815&s=640" alt="Vue logo" />

        <div class="container ui react-ui size" id="info">
            <div class="info-row">
                <img class="info-icon" src="../assets/location.svg" alt="Location" />
                <div class="info-value">Chongqing, China</div>
            </div>
            <div class="info-row">
                <img class="info-icon" src="../assets/team.svg" alt="Team" />
                <div class="info-value">
                    <a href="https://liteyuki.icu">Liteyuki</a>
                     & 
                     <a href="https://redrock.team">Redrock</a>
                    </div>
            </div>
        </div>
        <div class="container ui react-ui size" id="tags">
            <div class="tag react-ui color" v-for="tag in tags" :key="tag">{{ tag }}</div>
        </div>
        <!-- <div class="container ui" id="timeline">

        </div> -->
    </div>
</template>

<script setup lang="ts">
const tags = [
    '后端', '轻雪', '红岩', 'MC', '音乐', 'Linux', '原神', 'CRT'
]
</script>

<style lang="css">
#left {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    color: white;

    .container{
        width: 100%;
    }
}


.avatar {
    width: 200px;
    aspect-ratio: 1;
    border-radius: 50%;
    margin: 1rem;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.info-row {
    display: flex;
    align-items: center;
    margin: 10px 0;
    height: 2rem;
    justify-content: space-between;
}

.info-icon{
    max-height: 70%;
}

.info-value {
    color: white;
    font-size: small;
}

#tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    font-size: small;
}

.tag {
    color: white;
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 5rem;
    padding: 0.5rem 0.75rem;
}

/* 手机下不显示info和tags */
@media (max-width: 768px) {
    #info, #tags {
        display: none;
    }
}
</style>