// ==UserScript==
// @name         Dynamic-HTML5-Video-Control
// @namespace    Violentmonkey Scripts
// @description  Video control for HTML5 videos on all websites.
// @version      1.6
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    let videoSpeed, videoSaturation, oldVideoSaturation, speedDisplay, videoSaturationDisplay, speedDisplayTimeout,
    videoSaturationDisplayTimeout;
    let lastVideo = null;
    const MIN_RATE = 0, MAX_RATE = 5, RATE_STEP = 0.05, MIN_SATURATION = 0, MAX_SATURATION = 2, SATURATION_STEP = 0.1;

    document.addEventListener("keydown", function (event) {
        const videos = Array.from(document.getElementsByTagName("video"));
        const video = videos.find(v => !v.paused && !v.ended && v.readyState > 2);

        if (video) {
            handlePressedKey(event, video);
        }
    });

    /**
     * Create display for video
     * @param {Object} video
     * @param {String} type
     */
    function createDisplay(video, type) {
        const display = document.createElement('div');
        const settings = {
            position: 'absolute',
            top: type === 'speed' ? '10px' : '40px',
            left: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: type === 'speed' ? 'aquamarine' : 'lightcoral',
            padding: '5px',
            borderRadius: '5px',
            zIndex: '2147483647',
            opacity: '0',
        };
        Object.assign(display.style, settings);
        video.parentNode.appendChild(display);

        setTimeout(() => {
            if (display.style.opacity !== '1') {
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
        // Code omitted for brevity
        lastVideo = null; // Reset reference to last video
        video.playbackRate = 1;
        video.style.filter = 'none';

        speedDisplay.remove();
        videoSaturationDisplay.remove();

        videoSpeed = 1;
        videoSaturation = 1;
    }


    /**
     * Handle key press
     */
    function handlePressedKey(event, video) {
        const target = event.target;
        if (target.localName === "input" || target.localName === "textarea" || target.isContentEditable) return;

        let newRate = video.playbackRate;
        switch (event.key) {
            case "[":
                newRate = Math.max(MIN_RATE, video.playbackRate - RATE_STEP);
                break;
                case "]":
                    newRate = Math.min(MAX_RATE, video.playbackRate + RATE_STEP);
                    break;
                    case ";":
                        videoSaturation = Math.max(MIN_SATURATION, videoSaturation - SATURATION_STEP);
                        break;
                        case "'":
                            videoSaturation = Math.min(MAX_SATURATION, videoSaturation + SATURATION_STEP);
                            break;
                            // Reset all the video settings to default
            case "+":
                resetVideoSettings(video);
                break;
                // If any other key is pressed, do nothing/exit the function
            default:
                return;
        }

        if (newRate !== video.playbackRate) {
            video.playbackRate = newRate;
            videoSpeed = newRate;
            speedDisplay.textContent = `Speed: ${videoSpeed.toFixed(2)}`;
            speedDisplay.style.opacity = '1';
            // Clear previous timeout
            clearTimeout(speedDisplayTimeout);
            // Set up new timeout
            speedDisplayTimeout = setTimeout(() => {
                if (speedDisplay.style.opacity !== '0') {
                    speedDisplay.style.opacity = '0'
                }
            }, 1000);
        }

        if (videoSaturation !== oldVideoSaturation) {
            video.style.filter = `saturate(${videoSaturation})`;
            videoSaturationDisplay.textContent = `Saturation: ${videoSaturation.toFixed(2)}`;
            videoSaturationDisplay.style.opacity = '1';
            clearTimeout(videoSaturationDisplayTimeout);
            // Set up new timeout
            videoSaturationDisplayTimeout = setTimeout(() => {
                if (videoSaturationDisplay.style.opacity !== '0') {
                    videoSaturationDisplay.style.opacity = '0'
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
    function captureActiveVideoElement(video) {
        // Update speed and saturation only if lastVideo is null or a different video
        if (lastVideo !== video) {
            videoSpeed = video.playbackRate;
            videoSaturation = 1;
            lastVideo = video; // Update lastVideo
        }
        // Only create speedDisplay if it doesn't exist
        if (!speedDisplay) createDisplay(video, 'speed');

        // Same for saturation display
        if (!videoSaturationDisplay) createDisplay(video, 'saturation');
    }

    // Modify event listener
    document.addEventListener("play", (e) => {
        captureActiveVideoElement(e.target);
        }, true);
})();