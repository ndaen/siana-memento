"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Star, Trash2 } from "lucide-react";
import {
  getAdminTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  type Testimonial,
} from "@/lib/api/testimonials";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const MAX_NAME = 100;
const MAX_CONTENT = 2000;

interface FormState {
  authorName: string;
  content: string;
  isActive: boolean;
  rating: number;
}

const EMPTY_FORM: FormState = {
  authorName: "",
  content: "",
  isActive: true,
  rating: 5,
};

/** Affichage en lecture seule d'une note (étoiles pleines / vides) — utilisé dans la table. */
function RatingStars({ value }: { value: number }) {
  return (
    <div
      role="img"
      aria-label={`${value} étoile${value > 1 ? "s" : ""} sur 5`}
      className="flex gap-0.5"
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          aria-hidden="true"
          className={
            i < value
              ? "size-4 fill-current text-primary"
              : "size-4 text-muted-foreground/40"
          }
        />
      ))}
    </div>
  );
}

/** Sélecteur de note interactif (boutons étoile) pour le formulaire. */
function RatingPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Note en étoiles">
      {Array.from({ length: 5 }).map((_, i) => {
        const star = i + 1;
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} étoile${star > 1 ? "s" : ""}`}
            onClick={() => onChange(star)}
            className="rounded p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Star
              aria-hidden="true"
              className={
                star <= value
                  ? "size-6 fill-current text-primary"
                  : "size-6 text-muted-foreground/40"
              }
            />
          </button>
        );
      })}
    </div>
  );
}

// L'accès admin est garanti par AdminShell (layout /admin) — ce composant suppose un
// admin authentifié et ne re-vérifie pas l'auth.
export default function AdminTestimonials() {
  const [items, setItems] = useState<Testimonial[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Dialog création/édition
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<{
    authorName?: string;
    content?: string;
  }>({});
  const [submitting, setSubmitting] = useState(false);

  // Dialog suppression
  const [toDelete, setToDelete] = useState<Testimonial | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Lignes en cours de toggle (désactive la case le temps de la requête)
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

  async function load() {
    const result = await getAdminTestimonials();
    if (result.success) {
      setItems(result.data);
      setError(false);
    } else {
      toast.error(result.message);
      setError(true);
    }
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    getAdminTestimonials().then((result) => {
      if (!active) return;
      if (result.success) {
        setItems(result.data);
        setError(false);
      } else {
        toast.error(result.message);
        setError(true);
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setFormOpen(true);
  }

  function openEdit(t: Testimonial) {
    setEditing(t);
    setForm({
      authorName: t.authorName,
      content: t.content,
      isActive: t.isActive,
      rating: t.rating,
    });
    setFormErrors({});
    setFormOpen(true);
  }

  function validateForm(): boolean {
    const errs: { authorName?: string; content?: string } = {};
    if (!form.authorName.trim()) errs.authorName = "Le prénom est requis.";
    else if (form.authorName.trim().length > MAX_NAME)
      errs.authorName = `Le prénom ne doit pas dépasser ${MAX_NAME} caractères.`;
    if (!form.content.trim()) errs.content = "Le témoignage est requis.";
    else if (form.content.trim().length > MAX_CONTENT)
      errs.content = `Le témoignage ne doit pas dépasser ${MAX_CONTENT} caractères.`;
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);

    const payload = {
      authorName: form.authorName.trim(),
      content: form.content.trim(),
      isActive: form.isActive,
      rating: form.rating,
    };

    const result = editing
      ? await updateTestimonial(editing.id, payload)
      : await createTestimonial(payload);

    setSubmitting(false);

    if (result.success) {
      toast.success(editing ? "Témoignage modifié." : "Témoignage créé.");
      setFormOpen(false);
      await load();
    } else {
      toast.error(result.message);
    }
  }

  async function handleToggle(t: Testimonial, next: boolean) {
    setTogglingIds((prev) => new Set(prev).add(t.id));
    const result = await updateTestimonial(t.id, { isActive: next });
    setTogglingIds((prev) => {
      const s = new Set(prev);
      s.delete(t.id);
      return s;
    });
    if (result.success) {
      setItems((prev) =>
        prev
          ? prev.map((i) => (i.id === t.id ? { ...i, isActive: next } : i))
          : prev,
      );
      toast.success(next ? "Témoignage activé." : "Témoignage désactivé.");
    } else {
      toast.error(result.message);
    }
  }

  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    const result = await deleteTestimonial(toDelete.id);
    setDeleting(false);
    if (result.success) {
      toast.success("Témoignage supprimé.");
      setItems((prev) =>
        prev ? prev.filter((i) => i.id !== toDelete.id) : prev,
      );
      setToDelete(null);
    } else {
      toast.error(result.message);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Testimonials
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gérez les témoignages affichés sur la page d&apos;accueil.
          </p>
        </div>
        <Button onClick={openCreate}>Ajouter un témoignage</Button>
      </div>

      {loading ? (
        <div className="mt-6 space-y-3" aria-busy="true">
          <div className="h-10 w-full rounded bg-muted animate-pulse" />
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-12 w-full rounded bg-muted animate-pulse"
            />
          ))}
        </div>
      ) : error || !items ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <h2 className="font-display text-lg font-semibold">
            Impossible de charger les témoignages
          </h2>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Vérifiez votre connexion et réessayez dans quelques instants.
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <h2 className="font-display text-lg font-semibold">
            Aucun témoignage
          </h2>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Ajoutez-en un pour qu&apos;il apparaisse sur la page d&apos;accueil.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-border/60 bg-card">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/60 bg-muted/30 hover:bg-muted/30">
                <TableHead
                  scope="col"
                  className="h-12 px-6 text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  Prénom
                </TableHead>
                <TableHead
                  scope="col"
                  className="h-12 px-6 text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  Témoignage
                </TableHead>
                <TableHead
                  scope="col"
                  className="h-12 px-6 text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  Note
                </TableHead>
                <TableHead
                  scope="col"
                  className="h-12 px-6 text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  Statut
                </TableHead>
                <TableHead
                  scope="col"
                  className="h-12 px-6 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((t) => (
                <TableRow
                  key={t.id}
                  className="border-b border-border/40 transition-colors last:border-0 hover:bg-muted/40"
                >
                  <TableCell className="px-6 py-5 align-top text-sm font-medium text-foreground whitespace-nowrap">
                    {t.authorName}
                  </TableCell>
                  <TableCell className="w-full min-w-[18rem] max-w-lg px-6 py-5 align-top">
                    <span
                      className="line-clamp-2 whitespace-normal text-sm leading-relaxed text-muted-foreground"
                      title={t.content}
                    >
                      {t.content}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-5 align-top">
                    <RatingStars value={t.rating} />
                  </TableCell>
                  <TableCell className="px-6 py-5 align-top">
                    <div className="flex items-center gap-2.5">
                      <Checkbox
                        checked={t.isActive}
                        disabled={togglingIds.has(t.id)}
                        onCheckedChange={(v) => handleToggle(t, v === true)}
                        aria-label={`${t.isActive ? "Désactiver" : "Activer"} le témoignage de ${t.authorName}`}
                      />
                      {t.isActive ? (
                        <Badge>Actif</Badge>
                      ) : (
                        <Badge variant="secondary">Inactif</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-5 align-top text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(t)}
                        aria-label={`Modifier le témoignage de ${t.authorName}`}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setToDelete(t)}
                        aria-label={`Supprimer le témoignage de ${t.authorName}`}
                        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog création / édition */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Modifier le témoignage" : "Ajouter un témoignage"}
              </DialogTitle>
              <DialogDescription>
                Le prénom et le texte apparaîtront sur la page d&apos;accueil.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="testimonial-author">Prénom du client</Label>
                <Input
                  id="testimonial-author"
                  value={form.authorName}
                  maxLength={MAX_NAME}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, authorName: e.target.value }))
                  }
                  aria-describedby={
                    formErrors.authorName
                      ? "testimonial-author-error"
                      : undefined
                  }
                  aria-invalid={formErrors.authorName ? true : undefined}
                />
                {formErrors.authorName && (
                  <p
                    id="testimonial-author-error"
                    className="text-sm text-destructive"
                  >
                    {formErrors.authorName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="testimonial-content">Témoignage</Label>
                <Textarea
                  id="testimonial-content"
                  rows={5}
                  value={form.content}
                  maxLength={MAX_CONTENT}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, content: e.target.value }))
                  }
                  aria-describedby={
                    formErrors.content ? "testimonial-content-error" : undefined
                  }
                  aria-invalid={formErrors.content ? true : undefined}
                />
                {formErrors.content && (
                  <p
                    id="testimonial-content-error"
                    className="text-sm text-destructive"
                  >
                    {formErrors.content}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label asChild>
                  <span>Note</span>
                </Label>
                <RatingPicker
                  value={form.rating}
                  onChange={(rating) => setForm((f) => ({ ...f, rating }))}
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={form.isActive}
                  onCheckedChange={(v) =>
                    setForm((f) => ({ ...f, isActive: v === true }))
                  }
                />
                Actif (visible sur la page d&apos;accueil)
              </label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? "Enregistrement…"
                  : editing
                    ? "Enregistrer"
                    : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog confirmation suppression */}
      <Dialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce témoignage ?</DialogTitle>
            <DialogDescription>
              Cette action est définitive : le témoignage
              {toDelete ? ` de ${toDelete.authorName}` : ""} sera supprimé de la
              base de données et ne pourra pas être récupéré.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setToDelete(null)}
              disabled={deleting}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Suppression…" : "Supprimer définitivement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
