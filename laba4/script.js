// Отримуємо елементи
const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');
const svg = document.getElementById('mainSvg');
const colorPicker = document.getElementById('colorPicker');
const lineWidthInput = document.getElementById('lineWidth');
const sizeValue = document.getElementById('sizeValue');

// Кнопки режимів
const btnRaster = document.getElementById('btn-raster');
const btnVector = document.getElementById('btn-vector');
const rasterTools = document.getElementById('raster-tools');
const vectorTools = document.getElementById('vector-tools');
const modeText = document.getElementById('current-mode-text');

// Стан додатку
let mode = 'raster'; // raster або vector
let isDrawing = false;
let currentTool = 'brush'; // brush або eraser
let selectedShape = null;
let isDragging = false;
let offset = { x: 0, y: 0 };

// Налаштування розміру полотна
function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- ПЕРЕМИКАННЯ РЕЖИМІВ ---
btnRaster.onclick = () => {
    mode = 'raster';
    btnRaster.classList.add('active');
    btnVector.classList.remove('active');
    rasterTools.style.display = 'block';
    vectorTools.style.display = 'none';
    canvas.style.display = 'block';
    svg.style.display = 'none';
    modeText.innerText = 'Raster';
};

btnVector.onclick = () => {
    mode = 'vector';
    btnVector.classList.add('active');
    btnRaster.classList.remove('active');
    rasterTools.style.display = 'none';
    vectorTools.style.display = 'block';
    canvas.style.display = 'none';
    svg.style.display = 'block';
    modeText.innerText = 'Vector';
};

// --- РАСТРОВИЙ РЕДАКТОР (CANVAS) ---
lineWidthInput.oninput = (e) => {
    sizeValue.innerText = e.target.value;
};

canvas.addEventListener('mousedown', (e) => {
    if (mode !== 'raster') return;
    isDrawing = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
});

canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing || mode !== 'raster') return;
    
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.strokeStyle = currentTool === 'eraser' ? '#000' : colorPicker.value;
    ctx.lineWidth = lineWidthInput.value;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // "Магічний" ефект (додаємо невелике розмиття для плавності)
    ctx.shadowBlur = 2;
    ctx.shadowColor = ctx.strokeStyle;
    
    ctx.stroke();
});

canvas.addEventListener('mouseup', () => isDrawing = false);

document.getElementById('btn-brush').onclick = () => {
    currentTool = 'brush';
    document.getElementById('btn-brush').classList.add('active');
    document.getElementById('btn-eraser').classList.remove('active');
};

document.getElementById('btn-eraser').onclick = () => {
    currentTool = 'eraser';
    document.getElementById('btn-eraser').classList.add('active');
    document.getElementById('btn-brush').classList.remove('active');
};

document.getElementById('btn-clear-canvas').onclick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
};

document.getElementById('btn-save').onclick = () => {
    const link = document.createElement('a');
    link.download = 'my-drawing.png';
    link.href = canvas.toDataURL();
    link.click();
};

// --- ВЕКТОРНИЙ РЕДАКТОР (SVG) ---
const NS = "http://www.w3.org/2000/svg";

function createShape(type) {
    const shape = document.createElementNS(NS, type);
    const color = colorPicker.value;
    
    if (type === 'rect') {
        shape.setAttribute('x', 50);
        shape.setAttribute('y', 50);
        shape.setAttribute('width', 100);
        shape.setAttribute('height', 80);
    } else {
        shape.setAttribute('cx', 100);
        shape.setAttribute('cy', 100);
        shape.setAttribute('r', 50);
    }
    
    shape.setAttribute('fill', color);
    shape.style.cursor = 'move';
    
    // Вибір фігури при кліку
    shape.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        if (selectedShape) selectedShape.classList.remove('selected');
        selectedShape = shape;
        selectedShape.classList.add('selected');
        
        isDragging = true;
        const rect = svg.getBoundingClientRect();
        if (type === 'rect') {
            offset.x = e.clientX - rect.left - shape.getAttribute('x');
            offset.y = e.clientY - rect.top - shape.getAttribute('y');
        } else {
            offset.x = e.clientX - rect.left - shape.getAttribute('cx');
            offset.y = e.clientY - rect.top - shape.getAttribute('cy');
        }
    });

    svg.appendChild(shape);
}

document.getElementById('add-rect').onclick = () => createShape('rect');
document.getElementById('add-circle').onclick = () => createShape('circle');

// Drag & Drop для SVG
svg.addEventListener('mousemove', (e) => {
    if (!isDragging || !selectedShape) return;
    
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left - offset.x;
    const y = e.clientY - rect.top - offset.y;
    
    if (selectedShape.tagName === 'rect') {
        selectedShape.setAttribute('x', x);
        selectedShape.setAttribute('y', y);
    } else {
        selectedShape.setAttribute('cx', x);
        selectedShape.setAttribute('cy', y);
    }
});

window.addEventListener('mouseup', () => {
    isDragging = false;
});

// Видалення фігури
document.getElementById('btn-delete-shape').onclick = () => {
    if (selectedShape) {
        selectedShape.remove();
        selectedShape = null;
    }
};

// Зняття виділення при кліку на порожнє місце SVG
svg.addEventListener('mousedown', (e) => {
    if (e.target === svg) {
        if (selectedShape) selectedShape.classList.remove('selected');
        selectedShape = null;
    }
});