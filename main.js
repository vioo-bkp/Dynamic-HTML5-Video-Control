// ==UserScript==
// @name         Dynamic-HTML5-Video-Control
// @namespace    Violentmonkey Scripts
// @description  Video control for HTML5 videos on all websites.
// @version      1.7.0
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    let videoSpeed, videoSaturation, oldVideoSaturation, speedDisplay, videoSaturationDisplay, speedDisplayTimeout,
        videoSaturationDisplayTimeout;
    let lastVideo = null;
    const MIN_RATE = 0,
        MAX_RATE = 5,
        RATE_STEP = 0.05,
        MIN_SATURATION = 0,
        MAX_SATURATION = 3,
        SATURATION_STEP = 0.1;

    // Use captureEvent for play event to capture active video
    document.addEventListener("play", captureActiveVideoElement, true);
    // Use keydown for handling keypress events
    document.addEventListener("keydown", handlePressedKey);

    /**
     * Create display for video
     * @param {Object} video
     * @param {String} type
     */
    function createDisplay(video, type) {
        const display = document.createElement('span');
        display.style.position = 'fixed';
        display.style.top = type === 'speed' ? '10px' : '40px';
        display.style.left = '10px';
        display.style.backgroundColor = 'transparent';
        display.style.color = type === 'speed' ? 'aquamarine' : 'lightcoral';
        display.style.zIndex = '9999';
        display.style.opacity = '0';
        display.style.transition = 'opacity 1s';

        video.parentNode.appendChild(display);

        // Set timeout to hide display if it's not already hidden
        setTimeout(() => {
            if (display.style.opacity !== '0') {
                display.style.opacity = '0';
            }
        }, 1000);

        if (type === 'speed') {
            speedDisplay = display;
        } else {
            videoSaturationDisplay = display;
        }
    }

    /**
     * Reset all video settings to default
     * @param {Object} video
     */
    function resetVideoSettings(video) {
        if (!video) return;

        lastVideo = null; // Reset reference to last video
        video.playbackRate = 1;
        video.style.filter = 'none';

        // Remove displays
        speedDisplay.remove();
        videoSaturationDisplay.remove();

        videoSpeed = 1;
        videoSaturation = 1;
    }

    let dynamicAcceleration = {
        startingSpeed: 1.5,
        finalSpeed: 3,
        percentage: 0.6,
        startTime: 0,
        duration: 0,
        enable: false,
    };

    /**
     * Handle key press
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
                newRate = Math.max(MIN_RATE, video.playbackRate - RATE_STEP);
                break;
            case "]":
                newRate = Math.min(MAX_RATE, video.playbackRate + RATE_STEP);
                break;
            case "{":
                videoSaturation = Math.max(MIN_SATURATION, videoSaturation - SATURATION_STEP);
                break;
            case "}":
                videoSaturation = Math.min(MAX_SATURATION, videoSaturation + SATURATION_STEP);
                break;
            // Reset all the video settings to default
            case "`":
                resetVideoSettings(video);
                break;
            // Toggle dynamic acceleration
            case "d":
                dynamicAcceleration.enable = !dynamicAcceleration.enable;
                if (dynamicAcceleration.enable) {
                    dynamicAcceleration.startTime = video.currentTime;
                }
                break;
            default:
                return;
        }

        if (newRate !== video.playbackRate) {
            video.playbackRate = newRate;
            videoSpeed = newRate;
            speedDisplay.textContent = `Speed: ${videoSpeed.toFixed(2)}`;
            speedDisplay.style.opacity = '1';
            clearTimeout(speedDisplayTimeout);
            speedDisplayTimeout = setTimeout(() => {
                if (speedDisplay.style.opacity !== '0') {
                    speedDisplay.style.opacity = '0';
                }
            }, 1000);
        }

        if (videoSaturation !== oldVideoSaturation) {
            video.style.filter = `saturate(${videoSaturation})`;
            videoSaturationDisplay.textContent = `Saturation: ${videoSaturation.toFixed(2)}`;
            videoSaturationDisplay.style.opacity = '1';
            clearTimeout(videoSaturationDisplayTimeout);
            videoSaturationDisplayTimeout = setTimeout(() => {
                if (videoSaturationDisplay.style.opacity !== '0') {
                    videoSaturationDisplay.style.opacity = '0';
                }
            }, 1000);
            oldVideoSaturation = videoSaturation;
        } else {
            videoSaturationDisplay.style.opacity = '0';
        }
    }

    /**
     * Capture active video element
     */
    function captureActiveVideoElement(e) {
        const video = e.target;
        // Update speed and saturation only if lastVideo is null or a different video
        if (lastVideo !== video) {
            videoSpeed = video.playbackRate;
            videoSaturation = 1;
            lastVideo = video; // Update lastVideo
        }

        // Only create displays if they don't exist
        if (!speedDisplay) createDisplay(video, 'speed');
        if (!videoSaturationDisplay) createDisplay(video, 'saturation');

        if (dynamicAcceleration.enable) {
            // Calculate playback rate based on elapsed percentage
            const speedIncrement = dynamicAcceleration.startingSpeed + (dynamicAcceleration.finalSpeed - dynamicAcceleration.startingSpeed)
                * (video.currentTime / video.duration) / dynamicAcceleration.percentage;
            video.playbackRate = dynamicAcceleration.startingSpeed + speedIncrement;
        }
    }
})();