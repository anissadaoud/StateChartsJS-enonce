import Konva from "konva";
import { createMachine, createActor } from "xstate";

// L'endroit où le dessin va être affiché
const scene = new Konva.Stage({
    container: "container",
    width: 400,
    height: 400,
});

// Une couche pour le dessin
const draw = new Konva.Layer();
// Une couche pour la polyline en cours de construction
const temporaire = new Konva.Layer();
scene.add(draw);
scene.add(temporaire);

const MAX_POINTS = 10;
let polyline; // La polyline en cours de construction;

const polylineMachine = createMachine(
    {
        /** @xstate-layout N4IgpgJg5mDOIC5gF8A0IB2B7CdGgAcsAbATwBkBLDMfEI2SgF0qwzoA9EBaADgDoA7AE5RvQYICsARgBMAFkkA2XulI9p-AAyytvaVuGCle2bOkrkaeiQrUw-ShGK0kNxizadEAZmH9dLS05BXFJeR9ZNUReJQCRaXElKR8lWUFZKysgA */
        id: "polyLine",
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
    // Quelques actions et guardes que vous pouvez utiliser dans le statechart
    {
        actions: {
            // Créer une nouvelle polyline
            createLine: (context, event) => {
                const position = scene.getPointerPosition();
                polyline = new Konva.Line({
                    points: [position.x, position.y, position.x, position.y],
                    stroke: "red",
                    strokeWidth: 2,
                });
                temporaire.add(polyline);
            },
            // Mettre à jour le dernier point (provisoire) de la polyline
            setLastPoint: (context, event) => {
                const position = scene.getPointerPosition();
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;

                const newPoints = currentPoints.slice(0, size - 2); // Remove the last point
                polyline.points(newPoints.concat([position.x, position.y]));
                temporaire.batchDraw();
            },
            // Enregistrer la polyline
            saveLine: (context, event) => {
                polyline.remove(); // On l'enlève de la couche temporaire
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;
                // Le dernier point(provisoire) ne fait pas partie de la polyline
                const newPoints = currentPoints.slice(0, size - 2);
                polyline.points(newPoints);
                polyline.stroke("black"); // On change la couleur
                // On sauvegarde la polyline dans la couche de dessin
                draw.add(polyline); // On l'ajoute à la couche de dessin
            },
            // Ajouter un point à la polyline
            addPoint: (context, event) => {
                const position = scene.getPointerPosition();
                const currentPoints = polyline.points(); // Get the current points of the line
                const newPoints = [...currentPoints, position.x, position.y]; // Add the new point to the array
                polyline.points(newPoints); // Set the updated points to the line
                temporaire.batchDraw(); // Redraw the layer to reflect the changes
            },
            // Abandonner le tracé de la polyline
            abandon: (context, event) => {
                polyline.remove();
            },
            // Supprimer le dernier point de la polyline
            removeLastPoint: (context, event) => {
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;
                const provisoire = currentPoints.slice(size - 2, size); // Le point provisoire
                const oldPoints = currentPoints.slice(0, size - 4); // On enlève le dernier point enregistré
                polyline.points(oldPoints.concat(provisoire)); // Set the updated points to the line
                temporaire.batchDraw(); // Redraw the layer to reflect the changes
            },
        },
        guards: {
            // On peut encore ajouter un point
            pasPlein: (context, event) => {
                return polyline.points().length < MAX_POINTS * 2;
            },
            // On peut enlever un point
            plusDeDeuxPoints: (context, event) => {
                // Deux coordonnées pour chaque point, plus le point provisoire
                return polyline.points().length > 6;
            },
            canSave: (context, event) => {
                const pointCount = polyline.points().length / 2;
                return pointCount >= 2 && pointCount <= MAX_POINTS;
            },
        },
    }
);
// On démarre la machine d'état
const actor = createActor(polylineMachine);
actor.start();

// On transmet les événements au statechart
scene.on("click", () => {
    actor.send({ type: "MOUSECLICK" });
});

scene.on("mousemove", () => {
    actor.send({ type: "MOUSEMOVE" });
});

// Envoi des touches clavier à la machine
window.addEventListener("keydown", (event) => {
    console.log("Key pressed:", event.key);
    actor.send({ type: event.key });
});
