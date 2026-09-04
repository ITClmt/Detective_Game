<script setup lang="ts">
import { computed, ref } from "vue";

type Point = { x: number; y: number };
type Rect = { x: number; y: number; w: number; h: number };

const cursor = ref<Point>({ x: 0, y: 0 });
const dragStart = ref<Point | null>(null);
const rect = ref<Rect | null>(null);
const copied = ref(false);

function round(n: number) {
	return Math.round(n * 100) / 100;
}

function toPercent(event: MouseEvent): Point {
	const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
	return {
		x: ((event.clientX - box.left) / box.width) * 100,
		y: ((event.clientY - box.top) / box.height) * 100,
	};
}

function toRect(a: Point, b: Point): Rect {
	return {
		x: round(Math.min(a.x, b.x)),
		y: round(Math.min(a.y, b.y)),
		w: round(Math.abs(a.x - b.x)),
		h: round(Math.abs(a.y - b.y)),
	};
}

function handleMove(event: MouseEvent) {
	cursor.value = toPercent(event);
	if (dragStart.value) rect.value = toRect(dragStart.value, cursor.value);
}

function handleDown(event: MouseEvent) {
	dragStart.value = toPercent(event);
	rect.value = null;
	copied.value = false;
}

function handleUp() {
	dragStart.value = null;
}

const json = computed(() => (rect.value ? JSON.stringify(rect.value) : ""));

async function copy() {
	if (!json.value) return;

	await navigator.clipboard.writeText(json.value);
	copied.value = true;
	setTimeout(() => {
		copied.value = false;
	}, 1500);
}
</script>

<template>
	<!-- Outil de debug interne, usage souris uniquement — pas de version clavier. -->
	<!-- biome-ignore lint/a11y/noStaticElementInteractions: outil de debug interne, pas une UI finale -->
	<div
		class="absolute inset-0 z-30 cursor-crosshair"
		@mousedown="handleDown"
		@mousemove="handleMove"
		@mouseup="handleUp"
	>
		<div
			v-if="rect"
			class="pointer-events-none absolute border-2 border-dashed border-accent bg-accent/10"
			:style="{
				left: `${rect.x}%`,
				top: `${rect.y}%`,
				width: `${rect.w}%`,
				height: `${rect.h}%`,
			}"
		></div>

		<div
			class="pointer-events-none absolute bottom-2 left-2 border border-border bg-surface-raised/95 px-3 py-2 font-mono text-micro text-content"
		>
			<p>x: {{ round(cursor.x) }}% · y: {{ round(cursor.y) }}%</p>
			<p v-if="rect">{{ json }}</p>
		</div>

		<button
			v-if="rect"
			type="button"
			class="pointer-events-auto absolute right-2 bottom-2 cursor-pointer border border-accent bg-accent px-2 py-1 font-mono text-micro text-accent-contrast"
			@mousedown.stop
			@mouseup.stop
			@click.stop="copy"
		>
			{{ copied ? "COPIÉ" : "COPIER" }}
		</button>
	</div>
</template>
