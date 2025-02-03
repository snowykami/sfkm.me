<template>
    <div class="container" id="right">
        <div class="container" id="readme">
            你好呀
        </div>
        <div class="container" id="contacts">
            <a class="contact">
                <img class="contact-icon" src="../assets/contacts/github.svg" alt="GitHub" />
            </a>
        </div>
    </div>
</template>

<style lang="css">
#readme {
    color: white;
}

.contact {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    background-color: var(--container-background-color);
    margin: 1rem;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.contact-icon {
    width: 1rem;
}
</style>