"use client";

import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Trash2,
} from "lucide-react";

export type ComarcaPrioridade = {
  id: number;
  nome: string;
  circunscricao: string;
  raj: string;
};

type ComarcaPrioridadeListProps = {
  comarcas: ComarcaPrioridade[];
  onChange: (comarcas: ComarcaPrioridade[]) => void;
  onRemove: (comarcaId: number) => void;
};

type ItemOrdenavelProps = {
  comarca: ComarcaPrioridade;
  indice: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
};

function obterRotuloPrioridade(indice: number) {
  const prioridade = indice + 1;

  if (prioridade === 1) {
    return "1ª prioridade";
  }

  if (prioridade === 2) {
    return "2ª prioridade";
  }

  if (prioridade === 3) {
    return "3ª prioridade";
  }

  return `${prioridade}ª prioridade`;
}

function ItemOrdenavel({
  comarca,
  indice,
  total,
  onMoveUp,
  onMoveDown,
  onRemove,
}: ItemOrdenavelProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: comarca.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const podeArrastar = total > 1;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        "flex items-center gap-3 rounded-xl border bg-white p-3 shadow-sm transition",
        isDragging
          ? "z-50 scale-[1.02] border-blue-500 shadow-xl"
          : "border-slate-200 hover:border-blue-300",
      ].join(" ")}
    >
      <button
        type="button"
        disabled={!podeArrastar}
        aria-label={`Arrastar ${comarca.nome}`}
        title={
          podeArrastar
            ? "Arraste para alterar a prioridade"
            : "Adicione outra comarca para reorganizar"
        }
        className={[
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition",
          podeArrastar
            ? "cursor-grab text-slate-500 hover:bg-blue-50 hover:text-blue-900 active:cursor-grabbing"
            : "cursor-default text-slate-300",
        ].join(" ")}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" strokeWidth={1.8} />
      </button>

      <div className="flex h-9 min-w-9 shrink-0 items-center justify-center rounded-full bg-blue-900 px-2 text-sm font-bold text-white">
        {indice + 1}
      </div>

<div className="min-w-0 flex-1">

  <p className="text-xs font-semibold uppercase tracking-wide text-blue-800">
    {obterRotuloPrioridade(indice)}
  </p>


  <p className="mt-0.5 font-semibold text-slate-900">
    {comarca.nome}
  </p>


  <div className="mt-2 space-y-1 text-xs text-slate-500">

    <p>
      <strong>
        Circunscrição:
      </strong>{" "}
      {comarca.circunscricao}
    </p>


    <p>
      <strong>
        RAJ:
      </strong>{" "}
      {comarca.raj}
    </p>


  </div>


</div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={indice === 0}
          aria-label={`Subir ${comarca.nome} uma posição`}
          title="Subir uma posição"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-900 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronUp className="h-5 w-5" strokeWidth={1.8} />
        </button>

        <button
          type="button"
          onClick={onMoveDown}
          disabled={indice === total - 1}
          aria-label={`Descer ${comarca.nome} uma posição`}
          title="Descer uma posição"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-900 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronDown className="h-5 w-5" strokeWidth={1.8} />
        </button>

        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remover ${comarca.nome}`}
          title="Remover comarca"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-700"
        >
          <Trash2 className="h-5 w-5" strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}

export function ComarcaPrioridadeList({
  comarcas,
  onChange,
  onRemove,
}: ComarcaPrioridadeListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 180,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function moverComarca(indiceAtual: number, novoIndice: number) {
    if (
      novoIndice < 0 ||
      novoIndice >= comarcas.length ||
      indiceAtual === novoIndice
    ) {
      return;
    }

    onChange(arrayMove(comarcas, indiceAtual, novoIndice));
  }

  function finalizarArraste(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const indiceAtual = comarcas.findIndex(
      (comarca) => comarca.id === Number(active.id),
    );

    const novoIndice = comarcas.findIndex(
      (comarca) => comarca.id === Number(over.id),
    );

    if (indiceAtual === -1 || novoIndice === -1) {
      return;
    }

    onChange(arrayMove(comarcas, indiceAtual, novoIndice));
  }

  if (comarcas.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      {comarcas.length > 1 && (
        <p className="mb-3 text-sm text-slate-500">
          Arraste as comarcas ou use as setas para definir sua ordem de
          preferência.
        </p>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={finalizarArraste}
      >
        <SortableContext
          items={comarcas.map((comarca) => comarca.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {comarcas.map((comarca, indice) => (
              <ItemOrdenavel
                key={comarca.id}
                comarca={comarca}
                indice={indice}
                total={comarcas.length}
                onMoveUp={() => moverComarca(indice, indice - 1)}
                onMoveDown={() => moverComarca(indice, indice + 1)}
                onRemove={() => onRemove(comarca.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}