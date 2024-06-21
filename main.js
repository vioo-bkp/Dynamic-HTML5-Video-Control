// ==UserScript==
// @name         Dynamic-HTML5-Video-Control
// @namespace    Violentmonkey Scripts
// @description  Video control for HTML5 videos on all websites.
// @version      1.8.2
// @author       vioo-bkp
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const MIN_SPEED_RATE = 0,
        MAX_SPEED_RATE = 5,
        SPEED_RATE_STEP = 0.05,
        MIN_SATURATION = 0,
        MAX_SATURATION = 3,
        SATURATION_STEP = 0.1;

    let dynamicAcceleration = {
        enable: false,
        startingSpeed: 1,
        finalSpeed: 3,
        percentage: 0.6,
        startTime: 0,
    };

    let videoSpeed = 1;
    let videoSaturation = 1;
    let displayTimeout;

    // Create and style the display container
    const displayContainer = document.createElement('div');
    Object.assign(displayContainer.style, {
        position: 'absolute',
        top: '10px',
        left: '10px',
        zIndex: '9999',
        pointerEvents: 'none',
        transition: 'opacity 0.5s ease-in-out',
    });
    displayContainer.classList.add('video-control-overlay');

    function updateDisplay() {
        displayContainer.innerHTML = `
            <span style="color: aquamarine;">Speed: ${videoSpeed.toFixed(2)}</span><br>
            <span style="color: lightcoral;">Saturation: ${videoSaturation.toFixed(2)}</span>
        `;

        displayContainer.style.opacity = '1';

        clearTimeout(displayTimeout);
        displayTimeout = setTimeout(() => {
            displayContainer.style.opacity = '0';
        }, 3000);
    }

    function handlePressedKey(event) {
        const target = event.target;
        if (target.localName === "input" || target.localName === "textarea" || target.isContentEditable) return;

        const videos = Array.from(document.getElementsByTagName("video"));
        const video = videos.find(v => !v.paused && !v.ended && v.readyState > 2);
        if (!video) return;

        let newRate = video.playbackRate;
        switch (event.key) {
            case "[":
                newRate = Math.max(MIN_SPEED_RATE, video.playbackRate - SPEED_RATE_STEP);
                break;
            case "]":
                newRate = Math.min(MAX_SPEED_RATE, video.playbackRate + SPEED_RATE_STEP);
                break;
            case "{":
                videoSaturation = Math.max(MIN_SATURATION, videoSaturation - SATURATION_STEP);
                break;
            case "}":
                videoSaturation = Math.min(MAX_SATURATION, videoSaturation + SATURATION_STEP);
                break;
            case ":":
                dynamicAcceleration.enable = !dynamicAcceleration.enable;
                if (dynamicAcceleration.enable) {
                    dynamicAcceleration.startingSpeed = video.playbackRate;
                    dynamicAcceleration.startTime = video.currentTime;
                }
                break;
            case "`":
                newRate = 1;
                videoSaturation = 1;
                break;
            default:
                return;
        }

        if (newRate !== video.playbackRate) {
            video.playbackRate = newRate;
            videoSpeed = newRate;
        }

        video.style.filter = `saturate(${videoSaturation})`;
        updateDisplay();
    }

    function updateDynamicAcceleration(video) {
        if (!dynamicAcceleration.enable) return;

        const elapsedTime = video.currentTime - dynamicAcceleration.startTime;
        const accelerationDuration = video.duration * dynamicAcceleration.percentage;

        if (elapsedTime <= accelerationDuration) {
            const speedIncrement = (dynamicAcceleration.finalSpeed - dynamicAcceleration.startingSpeed) * 
                                   (elapsedTime / accelerationDuration);
            video.playbackRate = Math.min(dynamicAcceleration.startingSpeed + speedIncrement, dynamicAcceleration.finalSpeed);
            videoSpeed = video.playbackRate;
        }

        updateDisplay();
    }

    document.addEventListener("keydown", handlePressedKey);
    document.addEventListener("play", (event) => {
        if (event.target.tagName === 'VIDEO') {
            const video = event.target;
            const parent = video.parentElement;
            if (!parent) return;

            parent.appendChild(displayContainer);

            Object.assign(displayContainer.style, {
                position: 'absolute',
                top: '10px',
                left: '10px',
                margin: '10px',
            });

            dynamicAcceleration.startingSpeed = video.playbackRate;
            dynamicAcceleration.enable = false;

            updateDisplay();

            const animationFrame = () => {
                if (!video.paused && !video.ended) {
                    updateDynamicAcceleration(video);
                    requestAnimationFrame(animationFrame);
                }
            };
            requestAnimationFrame(animationFrame);
        }
    }, true);
})();
