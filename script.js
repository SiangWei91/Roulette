document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('rouletteCanvas');
    const ctx = canvas.getContext('2d');
    // const rouletteItemsTextarea = document.getElementById('rouletteItems'); // Removed
    const winnerDisplay = document.getElementById('winnerDisplay');
    const spinButton = document.getElementById('spinButton'); 
    const itemListContainer = document.getElementById('itemListContainer'); // Added
    const addItemButton = document.getElementById('addItemButton');     // Added

    let items = []; // This global 'items' array isn't directly used by drawWheel/getWinner anymore, they call getItems()
    // Initial bright colors array
    const colors = [
    '#FFDDC1', // Light Peach
    '#FFABAB', // Light Pink
    '#FFC3A0', // Light Apricot
    '#FFFDAF', // Light Yellow
    '#D4F0F0', // Light Cyan
    '#A2D2FF', // Light Blue
    '#BDB2FF', // Light Purple/Lavender
    '#C8E6C9', // Light Green
    '#FFE0B2', // Light Orange
    '#F0F4C3', // Light Lime
    '#D1C4E9', // Light Lilac
    '#B2EBF2', // Light Aqua
    '#FFCDD2', // Pale Pink
    '#F8BBD0'  // Lighter Pink
];
    
    let currentAngle = 0; // Used for the wheel's current rotation state for drawing
    let spinAnimationId = null; // Changed from animationFrameId for clarity, was spinAnimationId or similar
    let spinAngleStart = 0; // Target rotation angle for a spin
    let spinTime = 0;
    let spinTimeTotal = 0;
    let isSpinning = false;

    // const itemInputPlaceholder = "Item 1\nItem 2\nItem 3"; // Removed

    function resizeCanvas() {
        const canvas = document.getElementById('rouletteCanvas'); // Ensure canvas is fetched if not in scope
        if (canvas) { // Check if canvas exists
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
            drawWheel(currentAngle); // Redraw with new dimensions
        }
    }

    function getItems() {
       const items = [];
       const inputFields = itemListContainer.querySelectorAll('.item-input-field');
       inputFields.forEach(inputField => {
           const value = inputField.value.trim();
           if (value) {
               items.push(value);
           }
       });
       // If there are no items from inputs, and we want default placeholder items for drawing:
       // This behavior might need to be adjusted. The old version used textarea's placeholder.
       // For now, if all are empty, it will result in an empty items array.
       // The drawWheel function already handles numItems === 0.
       return items;
    }

    function addItemEntry(value = '') {
       const itemRow = document.createElement('div');
       itemRow.classList.add('item-input-row');

       const inputField = document.createElement('input');
       inputField.type = 'text';
       inputField.value = value;
       inputField.placeholder = 'Enter prize name';
       inputField.classList.add('item-input-field');
       inputField.addEventListener('input', () => {
           currentAngle = 0; // Reset angle if items change text
           drawWheel(currentAngle);
       });

       const removeButton = document.createElement('button');
       removeButton.type = 'button';
       removeButton.textContent = 'Remove';
       removeButton.classList.add('remove-item-button');
       removeButton.addEventListener('click', () => {
           itemRow.remove();
           currentAngle = 0; // Reset angle
           drawWheel(currentAngle);
       });

       itemRow.appendChild(inputField);
       itemRow.appendChild(removeButton);
       itemListContainer.appendChild(itemRow);
   }

    function drawWheel(rotationAngle = 0) {
        items = getItems();
        const numItems = items.length;
        // Ensure canvas dimensions are directly from the element, not hardcoded if they changed
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const arcSize = (2 * Math.PI) / numItems;
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        const radius = Math.min(centerX, centerY) * 0.9; // 90%

        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        
        if (numItems === 0) {
            ctx.fillStyle = '#7f8c8d';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = '20px Arial'; // Font for placeholder text
            ctx.fillText('Add items to spin!', centerX, centerY);
            return;
        }
        
        // Updated font style for wheel items
        ctx.font = '400 15px "Helvetica Neue", Arial, sans-serif'; 

        // 1. Draw Segments
        for (let i = 0; i < numItems; i++) {
            const angle = rotationAngle + i * arcSize;
            ctx.beginPath();
            ctx.fillStyle = colors[i % colors.length];
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, angle, angle + arcSize);
            ctx.closePath();
            ctx.fill();
        }

        // 2. Draw Frets
        if (numItems > 0) { // Only draw frets if there are items
            ctx.strokeStyle = '#CFD8DC'; // Light silver/grey for frets
            ctx.lineWidth = 1.5;        // Thin frets
            const hubRadiusForFrets = radius * 0.12; // Adjusted for a potentially smaller hub

            for (let i = 0; i < numItems; i++) { // Iterate numItems times for frets
                const angle = rotationAngle + i * arcSize; 
                ctx.beginPath();
                const startX = centerX + hubRadiusForFrets * Math.cos(angle);
                const startY = centerY + hubRadiusForFrets * Math.sin(angle);
                ctx.moveTo(startX, startY);
                const endX = centerX + radius * Math.cos(angle);
                const endY = centerY + radius * Math.sin(angle);
                ctx.lineTo(endX, endY);
                ctx.stroke();
            }
        }

        // 3. Draw Text
        ctx.fillStyle = '#000'; // Black text - set once for all text
        for (let i = 0; i < numItems; i++) {
            const angle = rotationAngle + i * arcSize;
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(angle + arcSize / 2);
            
            const text = items[i];
            const textMaxWidth = radius * 0.75; 
            ctx.textAlign = 'right'; 
            ctx.textBaseline = 'middle';
            
            let displayText = text;
            if (ctx.measureText(text).width > textMaxWidth) {
                while (ctx.measureText(displayText + '...').width > textMaxWidth && displayText.length > 0) {
                    displayText = displayText.substring(0, displayText.length - 1);
                }
                displayText += '...';
            }
            ctx.fillText(displayText, radius * 0.90, 0); 
            ctx.restore();
        }

        // 4. Draw 3D Hub
        if (numItems > 0) { // Only draw hub if there are items
            const hubBaseRadius = radius * 0.12;

            // Base of the hub with a shadow
            ctx.beginPath();
            ctx.arc(centerX, centerY, hubBaseRadius, 0, 2 * Math.PI);
            ctx.fillStyle = '#ECEFF1'; // Very light grey, almost white (hub body)
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            ctx.fill();
            
            // Clear shadow for next elements
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            // Highlight on the hub
            ctx.beginPath();
            const gradient = ctx.createRadialGradient(
                centerX - hubBaseRadius * 0.3, 
                centerY - hubBaseRadius * 0.3, 
                hubBaseRadius * 0.1, 
                centerX, 
                centerY, 
                hubBaseRadius * 0.8
            );
            gradient.addColorStop(0, 'rgba(255,255,255,0.9)');
            gradient.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = gradient;
            ctx.arc(centerX, centerY, hubBaseRadius * 0.95, 0, 2 * Math.PI);
            ctx.fill();

            // Central pin
            ctx.beginPath();
            ctx.fillStyle = '#78909C'; // Bluish grey - for pin
            ctx.arc(centerX, centerY, hubBaseRadius * 0.25, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    function easeOutCubic(t) {
        return (--t) * t * t + 1;
    }

    function rotateWheel() {
        spinTime += 16; // Approximate time per frame
        if (spinTime >= spinTimeTotal) {
            stopSpinning();
            return;
        }

        const timeFraction = spinTime / spinTimeTotal;
        const easedFraction = easeOutCubic(timeFraction);
        // spinAngleStart is the total rotation. currentAngle is the animated part of that.
        currentAngle = spinAngleStart * easedFraction; 

        drawWheel(currentAngle);
        spinAnimationId = requestAnimationFrame(rotateWheel);
    }

    function getWinner(finalAngle) {
        items = getItems(); 
        const numItems = items.length;
        if (numItems === 0) return null;

        const arcSize = (2 * Math.PI) / numItems;
        const pointerAngle = 0; // Pointer is at the right (0 radians)
        
        // Corrected angle calculation from initial functional version
        const correctedAngle = ( (2 * Math.PI) - (finalAngle % (2 * Math.PI)) + pointerAngle ) % (2 * Math.PI);
        let winningSegmentIndex = Math.floor(correctedAngle / arcSize);

        return items[winningSegmentIndex];
    }

    function stopSpinning() {
        cancelAnimationFrame(spinAnimationId);
        isSpinning = false;
        spinButton.disabled = false;
        // rouletteItemsTextarea.disabled = false; // Removed
        addItemButton.disabled = false; // Enable Add Item button
        document.querySelectorAll('.item-input-field').forEach(input => input.disabled = false);
        document.querySelectorAll('.remove-item-button').forEach(button => button.disabled = false);

        const winner = getWinner(currentAngle); // currentAngle is the final rotation offset
        if (winner) {
            winnerDisplay.textContent = winner;
        } else {
            winnerDisplay.textContent = '-';
        }
    }

    function spin() {
        if (isSpinning) return;
        
        // items = getItems(); // 'items' is not used in this function scope directly, getItems() is primarily for item count check
        const currentItems = getItems(); // Get items for checking length
        if (currentItems.length === 0) {
            alert("Please add items to the roulette first!");
            return;
        }

        isSpinning = true;
        spinButton.disabled = true;
        // rouletteItemsTextarea.disabled = true; // Removed
        addItemButton.disabled = true; // Disable Add Item button
        document.querySelectorAll('.item-input-field').forEach(input => input.disabled = true);
        document.querySelectorAll('.remove-item-button').forEach(button => button.disabled = true);
        winnerDisplay.textContent = '...'; // Spinning indicator

        // spinAngleStart is the total rotation amount for this spin
        const spinCycles = 5 + Math.random() * 5; 
        const randomExtraAngle = Math.random() * (2 * Math.PI); 
        spinAngleStart = (spinCycles * 2 * Math.PI) + randomExtraAngle;

        spinTime = 0; // Reset spin time for current spin
        // spinTimeTotal was used for duration, e.g. 4-6 seconds
        spinTimeTotal = 4000 + Math.random() * 2000; 
        
        // `currentAngle` will be updated by `rotateWheel` based on `spinAngleStart` and easing.
        // `drawWheel` will use that `currentAngle` to draw the rotated wheel.
        rotateWheel(); // Start the animation loop
    }

// Old textarea listener removed
// rouletteItemsTextarea.addEventListener('input', () => {
//     if (isSpinning) return; 
//     winnerDisplay.textContent = '-'; 
//     currentAngle = 0; // Reset rotation when items change
//     drawWheel(currentAngle); 
// });

    spinButton.addEventListener('click', spin);
    canvas.addEventListener('click', () => { // Spin by clicking wheel
        if (!isSpinning) {
            spin();
        }
    });

    addItemButton.addEventListener('click', () => {
       addItemEntry();
       currentAngle = 0; // Reset angle
       drawWheel(currentAngle); // Update wheel after adding a new potential segment
   });

    // Initial setup
// Old textarea population removed
// if (!rouletteItemsTextarea.value.trim()){
//    rouletteItemsTextarea.value = itemInputPlaceholder;
// }
    // Initial item input fields
    addItemEntry();
    addItemEntry();
    addItemEntry();

    currentAngle = 0; // Ensure initial angle is 0
    // Call resizeCanvas initially to set the correct size.
    // resizeCanvas() includes a call to drawWheel(), so the explicit one below is redundant.
    resizeCanvas(); 

    // Add resize event listener
    window.addEventListener('resize', resizeCanvas);

  // Service Worker Registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => { // Use window.load to ensure page is fully loaded
      navigator.serviceWorker.register('./service-worker.js')
        .then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        })
        .catch(error => {
          console.log('ServiceWorker registration failed: ', error);
        });
    });
  }
});
