// ==UserScript==
// @name         Dynamic-HTML5-Video-Control
// @namespace    Violentmonkey Scripts
// @description  Video control for HTML5 videos on all websites.
// @version      1.8.1
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
    let displayTimeout; // Timeout variable for fading out

    // Create a display container element
    const displayContainer = document.createElement('div');
    displayContainer.style.position = 'absolute';
    displayContainer.style.top = '10px';
    displayContainer.style.left = '10px';
    displayContainer.style.zIndex = '9999';
    displayContainer.style.pointerEvents = 'none';
    displayContainer.style.transition = 'opacity 0.5s ease-in-out'; // Add transition for fading
    // Add a class to style the container
    displayContainer.classList.add('video-control-overlay');

    function updateDisplay() {
        displayContainer.innerHTML = `
            <span style="color: aquamarine;">Speed: ${videoSpeed.toFixed(2)}</span><br>
            <span style="color: lightcoral;">Saturation: ${videoSaturation.toFixed(2)}</span>
        `;

        // Show the display
        displayContainer.style.opacity = '1';

        // Clear any existing timeout
        clearTimeout(displayTimeout);

        // Set a new timeout ONLY if one is not already running
        displayTimeout = setTimeout(() => {
            displayContainer.style.opacity = '0';
        }, 3000);
    }

    /**
     * Handle key press to control video playback.
     */
    function handlePressedKey(event) {
        const target = event.target;
        // Exit function if the event target is an input, textarea, or contentEditable element
        if (target.localName === "input" || target.localName === "textarea" || target.isContentEditable) return;

        const videos = Array.from(document.getElementsByTagName("video"));
        // Find the video that's playing and ready
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
            // Toggle dynamic acceleration
            case ":":
                dynamicAcceleration.enable = !dynamicAcceleration.enable;
                if (dynamicAcceleration.enable) {
                    dynamicAcceleration.startingSpeed = video.playbackRate;
                    dynamicAcceleration.startTime = video.currentTime;
                }
                break;
            // Reset speed and saturation
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

    /**
     * Update video playback rate if dynamic acceleration is enabled.
     */
    function updateDynamicAcceleration(video) {
        if (dynamicAcceleration.enable) {
            const elapsedTime = video.currentTime - dynamicAcceleration.startTime;
            const accelerationDuration = video.duration * dynamicAcceleration.percentage;

            // Calculate speed only if within the acceleration duration
            if (elapsedTime <= accelerationDuration) {
                const speedIncrement = (dynamicAcceleration.finalSpeed - dynamicAcceleration.startingSpeed) * 
                                       (elapsedTime / accelerationDuration);
                video.playbackRate = Math.min(dynamicAcceleration.startingSpeed + speedIncrement, dynamicAcceleration.finalSpeed);
                videoSpeed = video.playbackRate;
            } 
            // Update display and reset fade-out timer
            updateDisplay();
        }
    }

    // Event listeners
    document.addEventListener("keydown", handlePressedKey);
    document.addEventListener("play", (event) => {
        if (event.target.tagName === 'VIDEO') {
            const video = event.target;
            const parent = video.parentElement;

            // Append the display container inside the parent of the video
            parent.appendChild(displayContainer);

            // Set position relative to the video
            displayContainer.style.position = 'absolute';
            displayContainer.style.top = '10px';
            displayContainer.style.left = '10px';
            // Position relative to the video
            displayContainer.style.top = 0;
            displayContainer.style.left = 0;
            displayContainer.style.margin = '10px';

            // Update dynamicAcceleration.startingSpeed when a video starts or resumes
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