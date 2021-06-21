const coordsForTouchEvent = function(el, e) {
    const tx = e.changedTouches[0].clientX;
    const ty = e.changedTouches[0].clientY;
    const p = el.getBoundingClientRect();
    return [tx - p.left, ty - p.top];
};

const position = function(el, e) {
    const p = el.getBoundingClientRect();
    return {
        left: e.clientX - p.left,
        top: e.clientY - p.top,
    };
};

const buttonIsDown = function(e) {
    if (e.buttons != null) {
        return e.buttons === 1;
    } else {
        return e.which > 0;
    }
};

const bindEvents = function(lc, canvas, panWithKeyboard) {
    if (panWithKeyboard == null) {
        panWithKeyboard = true;
    }
    const unsubs = [];

    const mouseMoveListener = e => {
        e.preventDefault();
        const p = position(canvas, e);
        lc.pointerMove(p.left, p.top);
    };

    var mouseUpListener = e => {
        e.preventDefault();
        canvas.onselectstart = () => true; // enable selection while dragging
        const p = position(canvas, e);
        lc.pointerUp(p.left, p.top);
        document.removeEventListener("mousemove", mouseMoveListener);
        document.removeEventListener("mouseup", mouseUpListener);

        canvas.addEventListener("mousemove", mouseMoveListener);
    };

    canvas.addEventListener("mousedown", e => {
        if (e.target.tagName.toLowerCase() !== "canvas") {
            return;
        }

        const down = true;
        e.preventDefault();
        canvas.onselectstart = () => false; // disable selection while dragging
        const p = position(canvas, e);
        lc.pointerDown(p.left, p.top);

        canvas.removeEventListener("mousemove", mouseMoveListener);
        document.addEventListener("mousemove", mouseMoveListener);
        document.addEventListener("mouseup", mouseUpListener);
    });

    const touchMoveListener = function(e) {
        e.preventDefault();
        lc.pointerMove(...coordsForTouchEvent(canvas, e));
    };

    var touchEndListener = function(e) {
        e.preventDefault();
        lc.pointerUp(...coordsForTouchEvent(canvas, e));
        document.removeEventListener("touchmove", touchMoveListener);
        document.removeEventListener("touchend", touchEndListener);
        document.removeEventListener("touchcancel", touchEndListener);
    };

    canvas.addEventListener("touchstart", function(e) {
        if (e.target.tagName.toLowerCase() !== "canvas") {
            return;
        }
        e.preventDefault();
        if (e.touches.length === 1) {
            lc.pointerDown(...coordsForTouchEvent(canvas, e));
            document.addEventListener("touchmove", touchMoveListener);
            document.addEventListener("touchend", touchEndListener);
            document.addEventListener("touchcancel", touchEndListener);
        } else {
            touchEndListener(e);
        }
    });

    const deleteShapeHandler = () => {
        const selectedShape = lc.tool.selectedShape;

        if (selectedShape) {
            const selectedShapeIndex = lc.shapes.indexOf(selectedShape);

            lc.shapes.splice(selectedShapeIndex, 1);
            lc.setShapesInProgress([]); /* Also removes selection box */
            lc.trigger("shapeMoved", {shape: selectedShape});
            lc.trigger("drawingChange", {});
            lc.tool.selectedShape = null;
            lc.repaintLayer("main");
            lc.setTool(new LC.SelectShape(lc));
        }
    };

    if (true) {
        const deleteListener = function(e) {
            switch (e.code) {
                case "Backspace":
                    deleteShapeHandler();
                    break;
                default:
                    break;
            }
        };

        document.addEventListener("keydown", deleteListener);
        unsubs.push(() => document.removeEventListener(deleteListener));
    }

    return () => unsubs.map(f => f());
};

export default bindEvents;
