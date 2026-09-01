const startButton = document.getElementById("startButton");

const music = document.getElementById("backgroundMusic");

startButton.addEventListener("click", function () {

    music.play().catch(() => {
        console.log("Music could not start.");
    });

    window.location.href = "page2.html";

});