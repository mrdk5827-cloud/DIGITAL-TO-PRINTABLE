/* =========================================
   DIGITAL TO PRINTABLE
   ADVANCED SCRIPT - PART 1
========================================= */

pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";


/* =========================================
   VARIABLES
========================================= */

let pdfDocument = null;

let slides = [];

let deletedHistory = [];

let selectedSlideIds = new Set();

let slideCounter = 0;


/* =========================================
   ELEMENTS
========================================= */

const fileInput =
    document.getElementById("pdfFile");

const fileName =
    document.getElementById("fileName");

const totalSlides =
    document.getElementById("totalSlides");

const selectedSlides =
    document.getElementById("selectedSlides");

const slidesPerPageInfo =
    document.getElementById("slidesPerPageInfo");

const paperSaving =
    document.getElementById("paperSaving");

const slidesContainer =
    document.getElementById("slidesContainer");

const selectAllBtn =
    document.getElementById("selectAllBtn");

const clearAllBtn =
    document.getElementById("clearAllBtn");

const deleteBtn =
    document.getElementById("deleteBtn");

const undoBtn =
    document.getElementById("undoBtn");

const slidesPerPage =
    document.getElementById("slidesPerPage");

const margin =
    document.getElementById("margin");

const spacing =
    document.getElementById("spacing");

const marginValue =
    document.getElementById("marginValue");

const spacingValue =
    document.getElementById("spacingValue");

const generateBtn =
    document.getElementById("generateBtn");

const statusMessage =
    document.getElementById("statusMessage");


/* =========================================
   PDF UPLOAD
========================================= */

fileInput.addEventListener(
    "change",
    handlePDFUpload
);


async function handlePDFUpload(event) {

    const file =
        event.target.files[0];

    if (!file) {
        return;
    }


    /* Check PDF */

    if (
        file.type !== "application/pdf" &&
        !file.name.toLowerCase().endsWith(".pdf")
    ) {

        alert(
            "Please select a valid PDF file."
        );

        fileInput.value = "";

        return;
    }


    /* Reset old data */

    pdfDocument = null;

    slides = [];

    deletedHistory = [];

    selectedSlideIds.clear();

    slideCounter = 0;


    /* File name */

    fileName.textContent =
        "📄 " + file.name;


    /* Loading */

    statusMessage.textContent =
        "⏳ Loading PDF...";


    slidesContainer.innerHTML =
        '<div class="loading">Loading PDF...</div>';


    try {

        const arrayBuffer =
            await file.arrayBuffer();


        const loadingTask =
            pdfjsLib.getDocument({
                data: arrayBuffer
            });


        pdfDocument =
            await loadingTask.promise;


        totalSlides.textContent =
            pdfDocument.numPages;


        statusMessage.textContent =
            "⏳ Rendering slides...";


        await renderAllSlides();


        updateInformation();

        updateGenerateButton();


        statusMessage.textContent =
            "✅ PDF loaded successfully.";


    } catch (error) {

        console.error(error);

        slidesContainer.innerHTML =
            '<div class="empty-message">Unable to read this PDF.</div>';

        statusMessage.textContent =
            "❌ PDF could not be loaded.";

        alert(
            "PDF load error. Please try another PDF."
        );
    }
}


/* =========================================
   RENDER ALL SLIDES
========================================= */

async function renderAllSlides() {

    slidesContainer.innerHTML = "";


    for (
        let pageNumber = 1;
        pageNumber <= pdfDocument.numPages;
        pageNumber++
    ) {

        await renderSlide(pageNumber);
    }
}


/* =========================================
   RENDER SINGLE SLIDE
========================================= */

async function renderSlide(pageNumber) {

    const page =
        await pdfDocument.getPage(pageNumber);


    const viewport =
        page.getViewport({
            scale: 1
        });


    const canvas =
        document.createElement("canvas");


    const context =
        canvas.getContext("2d");


    const maxWidth = 300;


    const scale =
        Math.min(
            1.5,
            maxWidth / viewport.width
        );


    const scaledViewport =
        page.getViewport({
            scale: scale
        });


    canvas.width =
        scaledViewport.width;

    canvas.height =
        scaledViewport.height;


    await page.render({

        canvasContext: context,

        viewport: scaledViewport

    }).promise;


    /* Slide object */

    const slide = {

        id: ++slideCounter,

        pageNumber: pageNumber,

        canvas: canvas

    };


    slides.push(slide);


    createSlideCard(slide);
}


/* =========================================
   CREATE SLIDE CARD
========================================= */

function createSlideCard(slide) {

    const card =
        document.createElement("div");


    card.className =
        "slide-card";


    card.dataset.id =
        slide.id;


    const check =
        document.createElement("div");


    check.className =
        "slide-check";


    check.textContent =
        "✓";


    const number =
        document.createElement("div");


    number.className =
        "slide-number";


    number.textContent =
        "Slide " +
        slide.pageNumber;


    card.appendChild(check);

    card.appendChild(slide.canvas);

    card.appendChild(number);


    card.addEventListener(
        "click",
        () => toggleSlide(slide.id)
    );


    slidesContainer.appendChild(card);
}


/* =========================================
   TOGGLE SLIDE
========================================= */

function toggleSlide(id) {

    if (
        selectedSlideIds.has(id)
    ) {

        selectedSlideIds.delete(id);

    } else {

        selectedSlideIds.add(id);
    }


    updateSlideVisuals();

    updateInformation();

    updateGenerateButton();
}


/* =========================================
   UPDATE SLIDE VISUALS
========================================= */

function updateSlideVisuals() {

    const cards =
        document.querySelectorAll(
            ".slide-card"
        );


    cards.forEach(card => {

        const id =
            Number(card.dataset.id);


        if (
            selectedSlideIds.has(id)
        ) {

            card.classList.add(
                "selected"
            );

        } else {

            card.classList.remove(
                "selected"
            );
        }

    });
}


/* =========================================
   SELECT ALL
========================================= */

selectAllBtn.addEventListener(
    "click",
    selectAllSlides
);


function selectAllSlides() {

    selectedSlideIds.clear();


    slides.forEach(slide => {

        selectedSlideIds.add(
            slide.id
        );

    });


    updateSlideVisuals();

    updateInformation();

    updateGenerateButton();
}


/* =========================================
   CLEAR ALL
========================================= */

clearAllBtn.addEventListener(
    "click",
    clearAllSlides
);


function clearAllSlides() {

    selectedSlideIds.clear();


    updateSlideVisuals();

    updateInformation();

    updateGenerateButton();
}


/* =========================================
   DELETE SELECTED
========================================= */

deleteBtn.addEventListener(
    "click",
    deleteSelectedSlides
);


function deleteSelectedSlides() {

    if (
        selectedSlideIds.size === 0
    ) {

        alert(
            "Please select slides to delete."
        );

        return;
    }


    const deletedSlides =
        slides.filter(slide =>
            selectedSlideIds.has(
                slide.id
            )
        );


    deletedHistory.push(
        deletedSlides
    );


    slides =
        slides.filter(slide =>
            !selectedSlideIds.has(
                slide.id
            )
        );


    selectedSlideIds.clear();


    redrawSlides();

    updateInformation();

    updateGenerateButton();


    statusMessage.textContent =
        "🗑️ Selected slides deleted.";
}


/* =========================================
   UNDO DELETE
========================================= */

undoBtn.addEventListener(
    "click",
    undoDelete
);


function undoDelete() {

    if (
        deletedHistory.length === 0
    ) {

        alert(
            "Nothing to undo."
        );

        return;
    }


    const lastDeleted =
        deletedHistory.pop();


    slides.push(
        ...lastDeleted
    );


    slides.sort(
        (a, b) =>
            a.pageNumber -
            b.pageNumber
    );


    redrawSlides();

    updateInformation();

    updateGenerateButton();


    statusMessage.textContent =
        "↩️ Delete undone.";
}


/* =========================================
   REDRAW SLIDES
========================================= */

function redrawSlides() {

    slidesContainer.innerHTML = "";


    if (slides.length === 0) {

        slidesContainer.innerHTML =
            '<div class="empty-message">No slides available.</div>';

        return;
    }


    slides.forEach(
        createSlideCard
    );
}


/* =========================================
   INFORMATION
========================================= */

function updateInformation() {

    selectedSlides.textContent =
        selectedSlideIds.size;


    const perPage =
        Number(
            slidesPerPage.value
        );


    slidesPerPageInfo.textContent =
        perPage;


    if (slides.length > 0) {

        const originalPages =
            slides.length;


        const printablePages =
            Math.ceil(
                slides.length /
                perPage
            );


        const saving =
            Math.max(
                0,
                Math.round(
                    (
                        1 -
                        printablePages /
                        originalPages
                    ) * 100
                )
            );


        paperSaving.textContent =
            saving + "%";

    } else {

        paperSaving.textContent =
            "0%";
    }
}


/* =========================================
   SLIDES PER PAGE
========================================= */

slidesPerPage.addEventListener(
    "change",
    () => {

        updateInformation();

        updatePreview();
    }
);


/* =========================================
   MARGIN
========================================= */

margin.addEventListener(
    "input",
    () => {

        marginValue.textContent =
            margin.value;

        updatePreview();
    }
);


/* =========================================
   SPACING
========================================= */

spacing.addEventListener(
    "input",
    () => {

        spacingValue.textContent =
            spacing.value;

        updatePreview();
    }
);


/* =========================================
   GENERATE BUTTON
========================================= */

function updateGenerateButton() {

    generateBtn.disabled =
        slides.length === 0 ||
        selectedSlideIds.size === 0;
}


/* =========================================
   INITIAL STATE
========================================= */

updateInformation();

updateGenerateButton();


/* =========================================
   PREVIEW
========================================= */

function updatePreview() {

    const preview =
        document.getElementById(
            "previewContainer"
        );


    if (
        slides.length === 0 ||
        selectedSlideIds.size === 0
    ) {

        preview.innerHTML =
            '<div class="empty-message">Print preview will appear here.</div>';

        return;
    }


    const perPage =
        Number(
            slidesPerPage.value
        );


    const selectedSlides =
        slides.filter(slide =>
            selectedSlideIds.has(
                slide.id
            )
        );


    preview.innerHTML = "";


    const pageCount =
        Math.ceil(
            selectedSlides.length /
            perPage
        );


    const info =
        document.createElement("div");


    info.className =
        "empty-message";


    info.textContent =
        `Preview: ${pageCount} printable page(s)`;

    preview.appendChild(info);
}
/* =========================================
   PDF GENERATION ENGINE
========================================= */

generateBtn.addEventListener(
    "click",
    generatePrintablePDF
);


async function generatePrintablePDF() {

    if (
        slides.length === 0 ||
        selectedSlideIds.size === 0
    ) {

        alert(
            "Please upload a PDF and select at least one slide."
        );

        return;
    }


    generateBtn.disabled = true;

    statusMessage.textContent =
        "⏳ Creating printable PDF...";


    try {

        const {
            jsPDF
        } = window.jspdf;


        /* ================================
           SETTINGS
        ================================= */

        const selectedSlides =
            slides.filter(slide =>
                selectedSlideIds.has(
                    slide.id
                )
            );


        const perPage =
            Number(
                slidesPerPage.value
            );


        const selectedPaper =
            document.getElementById(
                "paperSize"
            ).value;


        const selectedOrientation =
            document.getElementById(
                "orientation"
            ).value;


        const marginMM =
            Number(
                margin.value
            );


        const spacingMM =
            Number(
                spacing.value
            );


        const borderEnabled =
            document.getElementById(
                "border"
            ).checked;


        const printMode =
            document.querySelector(
                'input[name="printMode"]:checked'
            ).value;


        /* ================================
           CREATE PDF
        ================================= */

        const pdf =
            new jsPDF({

                orientation:
                    selectedOrientation,

                unit: "mm",

                format:
                    selectedPaper,

                compress: true

            });


        /* ================================
           PAGE SIZE
        ================================= */

        const pageWidth =
            pdf.internal.pageSize.getWidth();


        const pageHeight =
            pdf.internal.pageSize.getHeight();


        /* ================================
           GRID
        ================================= */

        const grid =
            getGrid(perPage);


        const columns =
            grid.columns;


        const rows =
            grid.rows;


        const availableWidth =
            pageWidth -
            marginMM * 2;


        const availableHeight =
            pageHeight -
            marginMM * 2;


        const totalSpacingX =
            spacingMM *
            (columns - 1);


        const totalSpacingY =
            spacingMM *
            (rows - 1);


        const cellWidth =
            (
                availableWidth -
                totalSpacingX
            ) / columns;


        const cellHeight =
            (
                availableHeight -
                totalSpacingY
            ) / rows;


        /* ================================
           SLIDES
        ================================= */

        for (
            let i = 0;
            i < selectedSlides.length;
            i++
        ) {

            const position =
                i % perPage;


            if (
                position === 0 &&
                i !== 0
            ) {

                pdf.addPage();
            }


            const row =
                Math.floor(
                    position /
                    columns
                );


            const column =
                position %
                columns;


            const x =
                marginMM +
                column *
                (
                    cellWidth +
                    spacingMM
                );


            const y =
                marginMM +
                row *
                (
                    cellHeight +
                    spacingMM
                );


            await addSlideToPDF({

                pdf,

                slide:
                    selectedSlides[i],

                x,

                y,

                width:
                    cellWidth,

                height:
                    cellHeight,

                borderEnabled,

                printMode

            });

        }


        /* ================================
           DOWNLOAD
        ================================= */

        const fileName =
            "Digital-To-Printable.pdf";


        pdf.save(fileName);


        statusMessage.textContent =
            "✅ Printable PDF created successfully.";


    } catch (error) {

        console.error(error);

        statusMessage.textContent =
            "❌ PDF generation failed.";

        alert(
            "Something went wrong while creating the PDF."
        );

    } finally {

        generateBtn.disabled =
            false;
    }
}


/* =========================================
   GRID CALCULATION
========================================= */

function getGrid(perPage) {

    const grids = {

        1: {
            columns: 1,
            rows: 1
        },

        2: {
            columns: 1,
            rows: 2
        },

        4: {
            columns: 2,
            rows: 2
        },

        6: {
            columns: 2,
            rows: 3
        },

        8: {
            columns: 2,
            rows: 4
        },

        9: {
            columns: 3,
            rows: 3
        },

        12: {
            columns: 3,
            rows: 4
        }

    };


    return (
        grids[perPage] ||
        grids[1]
    );
}


/* =========================================
   ADD SLIDE TO PDF
========================================= */

async function addSlideToPDF({

    pdf,
    slide,
    x,
    y,
    width,
    height,
    borderEnabled,
    printMode

}) {

    const canvas =
        slide.canvas;


    /* ================================
       CREATE TEMP CANVAS
    ================================= */

    const tempCanvas =
        document.createElement(
            "canvas"
        );


    const context =
        tempCanvas.getContext(
            "2d"
        );


    tempCanvas.width =
        canvas.width;

    tempCanvas.height =
        canvas.height;


    /* ================================
       WHITE BACKGROUND
    ================================= */

    context.fillStyle =
        "#ffffff";

    context.fillRect(
        0,
        0,
        tempCanvas.width,
        tempCanvas.height
    );


    /* ================================
       COLOR / B&W
    ================================= */

    if (
        printMode === "bw"
    ) {

        context.filter =
            "grayscale(100%)";
    }


    context.drawImage(
        canvas,
        0,
        0
    );


    context.filter =
        "none";


    const imageData =
        tempCanvas.toDataURL(
            "image/jpeg",
            0.92
        );


    /* ================================
       KEEP ASPECT RATIO
    ================================= */

    const imageRatio =
        tempCanvas.width /
        tempCanvas.height;


    const boxRatio =
        width /
        height;


    let finalWidth =
        width;


    let finalHeight =
        height;


    if (
        imageRatio > boxRatio
    ) {

        finalHeight =
            width /
            imageRatio;

    } else {

        finalWidth =
            height *
            imageRatio;
    }


    const finalX =
        x +
        (
            width -
            finalWidth
        ) / 2;


    const finalY =
        y +
        (
            height -
            finalHeight
        ) / 2;


    /* ================================
       ADD IMAGE
    ================================= */

    pdf.addImage(

        imageData,

        "JPEG",

        finalX,

        finalY,

        finalWidth,

        finalHeight,

        undefined,

        "FAST"

    );


    /* ================================
       BORDER
    ================================= */

    if (borderEnabled) {

        pdf.setDrawColor(
            120,
            120,
            120
        );

        pdf.setLineWidth(
            0.3
        );


        pdf.rect(
            x,
            y,
            width,
            height
        );
    }
}
/* =========================================
   ADVANCED VISUAL PRINT PREVIEW
========================================= */

function createVisualPreview() {

    const preview =
        document.getElementById("previewContainer");

    preview.innerHTML = "";

    if (
        slides.length === 0 ||
        selectedSlideIds.size === 0
    ) {
        preview.innerHTML =
            '<div class="empty-message">Print preview will appear here.</div>';

        return;
    }

    const perPage =
        Number(slidesPerPage.value);

    const selected =
        slides.filter(slide =>
            selectedSlideIds.has(slide.id)
        );

    const grid =
        getGrid(perPage);

    const paper =
        document.getElementById("paperSize").value;

    const orientation =
        document.getElementById("orientation").value;

    const marginSize =
        Number(margin.value);

    const spacingSize =
        Number(spacing.value);

    const borderEnabled =
        document.getElementById("border").checked;

    /* Preview paper */

    const paperElement =
        document.createElement("div");

    paperElement.className =
        "preview-paper";

    if (paper === "A4") {
        paperElement.dataset.paper = "a4";
    }

    if (paper === "A5") {
        paperElement.dataset.paper = "a5";
    }

    if (paper === "LETTER") {
        paperElement.dataset.paper = "letter";
    }

    paperElement.dataset.orientation =
        orientation;

    /* Grid */

    const gridElement =
        document.createElement("div");

    gridElement.className =
        "preview-grid";

    gridElement.style.gridTemplateColumns =
        `repeat(${grid.columns}, 1fr)`;

    gridElement.style.gridTemplateRows =
        `repeat(${grid.rows}, 1fr)`;

    gridElement.style.gap =
        Math.max(
            2,
            spacingSize
        ) + "px";

    gridElement.style.padding =
        Math.max(
            5,
            marginSize
        ) + "px";


    selected.forEach(slide => {

        const item =
            document.createElement("div");

        item.className =
            "preview-slide";

        if (borderEnabled) {
            item.classList.add(
                "preview-border"
            );
        }

        const image =
            document.createElement("canvas");

        image.width =
            slide.canvas.width;

        image.height =
            slide.canvas.height;

        const ctx =
            image.getContext("2d");

        ctx.drawImage(
            slide.canvas,
            0,
            0
        );

        item.appendChild(image);

        gridElement.appendChild(item);
    });

    paperElement.appendChild(
        gridElement
    );

    preview.appendChild(
        paperElement
    );
}


/* =========================================
   PREVIEW EVENTS
========================================= */

slidesPerPage.addEventListener(
    "change",
    createVisualPreview
);

margin.addEventListener(
    "input",
    createVisualPreview
);

spacing.addEventListener(
    "input",
    createVisualPreview
);


document
    .getElementById("paperSize")
    .addEventListener(
        "change",
        createVisualPreview
    );


document
    .getElementById("orientation")
    .addEventListener(
        "change",
        createVisualPreview
    );


document
    .getElementById("border")
    .addEventListener(
        "change",
        createVisualPreview
    );


document
    .querySelectorAll(
        'input[name="printMode"]'
    )
    .forEach(input => {

        input.addEventListener(
            "change",
            createVisualPreview
        );

    });


/* =========================================
   UPDATE PREVIEW AFTER SELECTION
========================================= */

const originalToggleSlide =
    toggleSlide;

toggleSlide = function(id) {

    originalToggleSlide(id);

    createVisualPreview();
};


/* =========================================
   UPDATE PREVIEW AFTER DELETE
========================================= */

const originalDeleteSelectedSlides =
    deleteSelectedSlides;

deleteSelectedSlides = function() {

    originalDeleteSelectedSlides();

    setTimeout(
        createVisualPreview,
        50
    );
};


/* =========================================
   UPDATE PREVIEW AFTER SELECT ALL
========================================= */

const originalSelectAllSlides =
    selectAllSlides;

selectAllSlides = function() {

    originalSelectAllSlides();

    createVisualPreview();
};


/* =========================================
   UPDATE PREVIEW AFTER CLEAR ALL
========================================= */

const originalClearAllSlides =
    clearAllSlides;

clearAllSlides = function() {

    originalClearAllSlides();

    createVisualPreview();
};
