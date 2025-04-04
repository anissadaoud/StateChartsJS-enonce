import { createMachine, createActor } from "xstate";
import Konva from "konva";

// Les éléments HTML de la page
const scene = new Konva.Stage({
    container: "container",
    width: 400,
    height: 400,
});
const dessin = new Konva.Layer();
const temporaire = new Konva.Layer();
scene.add(dessin);
scene.add(temporaire);

const MAX_POINTS = 10;
let polyline;

const polylineMachine = createMachine(
    {
        /** @xstate-layout N4IgpgJg5mDOIC5QAcD2AbAnuglgOzADocJ0wBiAWQHkBVAZQFEBhAGQElmBpAbQAYAuohSpYOAC45UeYSAAeiPgBoQmRQF91KtFlwFCEAE4BDAO74oVOkxoA1RvyFIQaMZOmyFCALQBGAOwALISBfGEATHwAnL4AHFEArL4AzABsKmo+sb6EUXl5kakJUXyBvpraGNj4REZmFlYMLBzcjrKuElIyzl7hscGxYaXJ-gmlqcm+CRmIyeEhQ76RgVGB4XGBqRUuVXq1JuZ4lgBCAILc9AAK5w6C7aKdHj2IfQmEqWFTabEJ65vTqkQvhi7yGfH8iVWeX8sW2Omq+jqh0sjDw4jAhjazg67m6oF6SUIkSGZT6fHCMMCMx8-nmoTBaTSCUmyThuxqBgODUYsAAxsZkGAsSI3F1PEDYrFCIM+L45ZsYhNfFTAQh5YQweEEoEyiVwnNNFoQHhUBA4PddDV7qKnvjEN5wo6FhFonFEil0qq-KkokT8qtsslAgl+qyjfC9sRSGBrY88fJFNTlYE2ZbEVyjrHceKEMpVWTCP5Ur5i5MUv1wob1EA */
        id: "polyline",
        initial: "idle",
        states: {
            idle: {
                on: {
                    MOUSECLICK: {
                        target: "drawing",
                        actions: "createLine",
                    },
                },
            },
            drawing: {
                on: {
                    MOUSEMOVE: {
                        actions: "setLastPoint",
                    },
                    MOUSECLICK: [
                        {
                            guard: "pasPlein",
                            actions: "addPoint",
                        },
                    ],
                    BACKSPACE: [
                        {
                            guard: "plusDeDeuxPoints",
                            actions: "removeLastPoint",
                        },
                    ],
                    Enter: [
                        {
                            guard: "canSave",
                            target: "idle",
                            actions: "saveLine",
                        },
                    ],
                    Escape: {
                        target: "idle",
                        actions: "abandon",
                    },
                },
            },
        },
    },
    {
        actions: {
            createLine: (context, event) => {
                const pos = stage.getPointerPosition();
                polyline = new Konva.Line({
                    points: [pos.x, pos.y, pos.x, pos.y],
                    stroke: "red",
                    strokeWidth: 2,
                });
                temporaire.add(polyline);
            },
            setLastPoint: (context, event) => {
                const pos = stage.getPointerPosition();
                const currentPoints = polyline.points();
                const size = currentPoints.length;
                const newPoints = currentPoints.slice(0, size - 2); // Remove the last point
                polyline.points(newPoints.concat([pos.x, pos.y]));
                temporaire.batchDraw();
            },
            addPoint: (context, event) => {
                const pos = stage.getPointerPosition();
                const currentPoints = polyline.points();
                const newPoints = [...currentPoints, pos.x, pos.y];
                polyline.points(newPoints);
                temporaire.batchDraw();
            },
            removeLastPoint: (context, event) => {
                const currentPoints = polyline.points();
                const size = currentPoints.length;
                const provisoire = currentPoints.slice(size - 2, size);
                const oldPoints = currentPoints.slice(0, size - 4);
                polyline.points(oldPoints.concat(provisoire));
                temporaire.batchDraw();
            },
            saveLine: (context, event) => {
                polyline.remove();
                const currentPoints = polyline.points();
                const size = currentPoints.length;
                const newPoints = currentPoints.slice(0, size - 2);
                polyline.points(newPoints);
                polyline.stroke("black");
                dessin.add(polyline);
            },
            abandon: (context, event) => {
                polyline.remove();
            },
        },
        guards: {
            pasPlein: (context, event) => {
                return polyline.points().length < MAX_POINTS * 2;
            },
            plusDeDeuxPoints: (context, event) => {
                return polyline.points().length > 6;
            },
            canSave: (context, event) => {
                const pointCount = polyline.points().length / 2;
                return pointCount >= 2 && pointCount <= MAX_POINTS;
            },
        },
    }
);

const actor = createActor(polylineMachine);

// Gestion des événements sur le stage
stage.on("click", () => {
    actor.send({ type: "MOUSECLICK" });
});

stage.on("mousemove", () => {
    actor.send({ type: "MOUSEMOVE" });
});

window.addEventListener("keydown", (event) => {
    if (event.key === "Backspace") {
        actor.send({ type: "BACKSPACE" });
    } else if (event.key === "Enter") {
        actor.send({ type: "Enter" });
    } else if (event.key === "Escape") {
        actor.send({ type: "Escape" });
    }
});
