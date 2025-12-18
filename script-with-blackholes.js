// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded, initializing app...');

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    console.log('Canvas initialized:', canvas.width, 'x', canvas.height);

    // Background images
    const bg1 = document.getElementById('bg1');
    const bg2 = document.getElementById('bg2');

    // NASA/NOAA background images shift
    bg1.style.background = 'url("assets/code_NASANOAAimg2.jpg")';
    bg1.style.backgroundSize = 'cover';
    bg1.style.backgroundPosition = 'center';

    bg2.style.background = 'url("assets/code_NASANOAAimg6.jpg")';
    bg2.style.backgroundSize = 'cover';
    bg2.style.backgroundPosition = 'center';

    // Black hole images array
    let blackholeImages = [];
    let imagesLoaded = false;
    const blackholeImageNames = [
        "blackhole-1.png",
        "blackhole-2.png",
        "blackhole-3.png",
        "blackhole-4.png",
        "blackhole-5.png",
        "blackhole-6.png",
        "blackhole-7.png"
    ];

    // Preload black hole images
    function preloadImages() {
        let loadedCount = 0;

        blackholeImageNames.forEach((imageName, index) => {
            const img = new Image();
            img.onload = () => {
                loadedCount++;
                if (loadedCount === blackholeImageNames.length) {
                    imagesLoaded = true;
                    console.log('All black hole images loaded');
                }
            };
            img.onerror = () => {
                console.warn(`Could not load image: ${imageName}`);
                loadedCount++;
                if (loadedCount === blackholeImageNames.length) {
                    imagesLoaded = true;
                }
            };
            img.src = `assets/images/${imageName}`;
            blackholeImages.push(img);
        });
    }

    // Start preloading images
    preloadImages();

    // Audio setup
    let player, tremolo, delay, fft, analyzer;
    let isPlaying = false;
    let bgSwitch = true;

    const startButton = document.getElementById('start-button');
    const playButton = document.getElementById('playButton');
    const controls = document.getElementById('controls');
    const xyPad = document.getElementById('xyPad');

    console.log('Elements found:', {
        startButton: !!startButton,
        playButton: !!playButton,
        xyPad: !!xyPad
    });

    startButton.addEventListener('click', async () => {
        startButton.disabled = true;

        try {
            await Tone.start();
            console.log('Audio context started');

            // Create audio effects
            tremolo = new Tone.Tremolo(4, 0.5).start();
            delay = new Tone.FeedbackDelay(0.25, 0.5);
            fft = new Tone.FFT(256);
            analyzer = new Tone.Analyser('waveform', 256);


            player = new Tone.Player({
                url: "assets/apparition-ox-clip.mp3",
                loop: true
            });

            // Connect audio chain with effects
            player.chain(tremolo, delay, fft, analyzer, Tone.Destination);

            await Tone.loaded();

            startButton.style.display = 'none';
            controls.style.display = 'block';

            // Start animation loop
            draw();

            // Start background transition
            startBackgroundTransition();

        } catch (error) {
            console.error('Error starting audio:', error);
            startButton.disabled = false;
        }
    });

    // Start/Stop control
    playButton.addEventListener('click', () => {
        if (player.state === 'started') {
            player.stop();
            playButton.textContent = 'Start';
            isPlaying = false;
        } else {
            player.start();
            playButton.textContent = 'Stop';
            isPlaying = true;
        }
    });

    // XY Pad for effects
    xyPad.addEventListener('mousemove', (e) => {
        if (!tremolo || !delay) return;

        const x = e.clientX / window.innerWidth;
        const y = 1 - (e.clientY / window.innerHeight);

        // X-axis: Tremolo intensity (0 to 1)
        tremolo.wet.value = x;
        tremolo.frequency.value = 1 + (x * 10);

        // Y-axis: Delay amount (0 to 1)
        delay.wet.value = y;
        delay.delayTime.value = y * 3;
    });

    // frequency visualization with black hole image spawning
    function draw() {
        requestAnimationFrame(draw);

        if (!fft || !isPlaying) return;

        const values = fft.getValue();
        const waveform = analyzer ? analyzer.getValue() : [];

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate average amplitude from frequency data
        let sum = 0;
        for (let i = 0; i < values.length; i++) {
            sum += (values[i] + 140) / 140; // Normalize
        }
        const avgAmplitude = sum / values.length;

        // Draw black hole images when amplitude is high enough
        // Threshold: when average amplitude exceeds 0.5 (adjust as needed)
        if (imagesLoaded && avgAmplitude > 0.3) {
            // Check waveform peaks for sporadic appearance
            for (let i = 0; i < waveform.length; i += 20) {
                const waveValue = waveform[i];

                // Trigger image appearance at high waveform values
                if (waveValue > 0.5 || waveValue < -0.5) {
                    const randomImg = blackholeImages[Math.floor(Math.random() * blackholeImages.length)];
                    const imgX = Math.random() * (canvas.width - 150);
                    const imgY = Math.random() * (canvas.height - 150);
                    const imgSize = 80 + Math.random() * 120; // Random size between 80-200px

                    // Draw with some transparency for ethereal effect
                    ctx.globalAlpha = 0.6 + (Math.random() * 0.4);
                    ctx.drawImage(randomImg, imgX, imgY, imgSize, imgSize);
                    ctx.globalAlpha = 1.0;
                }
            }
        }

        // white frequency line
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 4;
        ctx.beginPath();

        const sliceWidth = canvas.width / values.length;
        let x = 0;

        for (let i = 0; i < values.length; i++) {
            const value = values[i];
            const percent = (value + 140) / 140; // Normalize -140 to 0 dB
            const y = canvas.height - (canvas.height * percent * 1);

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        ctx.stroke();
    }

    //background images shift
    function startBackgroundTransition() {
        setInterval(() => {
            if (bgSwitch) {
                bg2.style.opacity = '1';
                bg1.style.opacity = '0';
            } else {
                bg1.style.opacity = '1';
                bg2.style.opacity = '0';
            }
            bgSwitch = !bgSwitch;
        }, 12000); // Switch every 12 sec
    }

    //window resize
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });

});
