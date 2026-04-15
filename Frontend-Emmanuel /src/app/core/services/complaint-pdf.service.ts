import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Complaint, SupportMessage, STATUS_LABELS, PRIORITY_LABELS, CATEGORY_LABELS, ResolutionType } from '../models/complaint.model';

// ── Palette NexLance ──────────────────────────────────────────
const C = {
  primary:     [14,  165, 233] as [number, number, number],   // #0EA5E9
  primaryDark: [2,   132, 199] as [number, number, number],   // #0284C7
  orange:      [249, 115,  22] as [number, number, number],   // #F97316
  gray900:     [17,  24,  39]  as [number, number, number],
  gray700:     [55,  65,  81]  as [number, number, number],
  gray500:     [107, 114, 128] as [number, number, number],
  gray200:     [229, 231, 235] as [number, number, number],
  gray100:     [243, 244, 246] as [number, number, number],
  white:       [255, 255, 255] as [number, number, number],
  success:     [16,  185, 129] as [number, number, number],
  warning:     [245, 158,  11] as [number, number, number],
  error:       [239,  68,  68] as [number, number, number],
};

interface PdfAgent {
  userId:    string;
  firstName: string;
  lastName:  string;
  email?:    string;
}

export interface PdfExportData {
  complaint:     Complaint;
  messages:      SupportMessage[];
  agents?:       PdfAgent[];
  reporterName?:  string;
  reporterEmail?: string;
  reportedName?:  string;
  reportedEmail?: string;
}

@Injectable({ providedIn: 'root' })
export class ComplaintPdfService {

  generate(data: PdfExportData): void {
    const { complaint, messages, agents = [] } = data;
    const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W    = doc.internal.pageSize.getWidth();   // 210
    const H    = doc.internal.pageSize.getHeight();  // 297
    let   y    = 0;

    // ── 1. EN-TÊTE ─────────────────────────────────────────────
    y = this.drawHeader(doc, W, complaint);

    // ── 2. INFORMATIONS GÉNÉRALES ─────────────────────────────
    y = this.drawSection(doc, y, 'Informations générales', 'info');
    y = this.drawInfoGrid(doc, y, W, [
      ['N° ticket',      complaint.ticketNumber || '—'],
      ['Statut',         STATUS_LABELS[complaint.status] || complaint.status],
      ['Priorité',       PRIORITY_LABELS[complaint.priority] || complaint.priority],
      ['Catégorie',      CATEGORY_LABELS[complaint.category] || complaint.category],
      ['Date de création', this.fmtDate(complaint.createdAt)],
      ['Première réponse', complaint.firstResponseAt ? this.fmtDate(complaint.firstResponseAt) : '—'],
      ['Résolue le',       complaint.resolvedAt ? this.fmtDate(complaint.resolvedAt) : '—'],
      ['Clôturée le',      complaint.closedAt   ? this.fmtDate(complaint.closedAt)   : '—'],
    ]);

    // ── 3. PARTIES CONCERNÉES ─────────────────────────────────
    y = this.drawSection(doc, y, 'Parties concernées', 'people');
    const assignedAgent = agents.find(a => a.userId === complaint.assignedToId);
    y = this.drawInfoGrid(doc, y, W, [
      ['Nom reporter',    data.reporterName  || '—'],
      ['Email reporter',  data.reporterEmail || '—'],
      ['Partie signalée', data.reportedName  || complaint.reportedUserId || '—'],
      ['Email signalé',   data.reportedEmail || '—'],
      ['Projet concerné', complaint.projectId || '—'],
      ['Agent assigné',
        assignedAgent
          ? `${assignedAgent.firstName} ${assignedAgent.lastName}`
          : (complaint.assignedToId ? complaint.assignedToId.substring(0, 8) + '…' : '— Non assignée')
      ],
      ['Email agent', assignedAgent?.email || '—'],
    ]);

    // ── 4. DESCRIPTION ────────────────────────────────────────
    y = this.drawSection(doc, y, 'Description de la réclamation', 'description');
    y = this.drawLabel(doc, y, 'Sujet');
    y = this.drawTextBlock(doc, y, W, complaint.subject, true);
    y += 3;
    y = this.drawLabel(doc, y, 'Description détaillée');
    y = this.drawTextBlock(doc, y, W, complaint.description, false);

    // ── 5. HISTORIQUE / ÉCHANGES ──────────────────────────────
    y = this.checkPageBreak(doc, y, H, 40);
    y = this.drawSection(doc, y, 'Historique des échanges', 'history');

    if (messages.length === 0) {
      y = this.drawEmptyRow(doc, y, W, 'Aucun message pour cette réclamation.');
    } else {
      const msgRows = messages.map(m => [
        this.fmtShortDate(m.createdAt),
        m.senderType === 'SUPPORT' ? 'Support' : 'Client/Utilisateur',
        this.truncate(m.content, 200),
        m.messageType === 'NOTE_INTERNE' ? 'Note interne' : 'Message'
      ]);

      autoTable(doc, {
        startY: y,
        head:   [['Date', 'Expéditeur', 'Contenu', 'Type']],
        body:   msgRows,
        margin: { left: 14, right: 14 },
        styles: {
          fontSize: 8,
          cellPadding: 3,
          textColor:   C.gray700,
          lineColor:   C.gray200,
          lineWidth:   0.2,
        },
        headStyles: {
          fillColor:  C.primary,
          textColor:  C.white,
          fontStyle:  'bold',
          fontSize:   8,
        },
        alternateRowStyles: { fillColor: C.gray100 },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 30 },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 25 },
        },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }

    // ── 6. PIÈCES JOINTES ─────────────────────────────────────
    y = this.checkPageBreak(doc, y, H, 30);
    y = this.drawSection(doc, y, 'Pièces jointes', 'attachments');

    const attachments = complaint.attachments ?? [];
    if (attachments.length === 0) {
      y = this.drawEmptyRow(doc, y, W, 'Aucune pièce jointe.');
    } else {
      const attachRows = attachments.map((a, i) => {
        const name = a.split('/').pop() ?? a;
        const ext  = name.split('.').pop()?.toUpperCase() ?? '—';
        return [`${i + 1}`, name, ext];
      });

      autoTable(doc, {
        startY: y,
        head:   [['#', 'Nom du fichier', 'Type']],
        body:   attachRows,
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8, cellPadding: 3, textColor: C.gray700, lineColor: C.gray200, lineWidth: 0.2 },
        headStyles: { fillColor: C.primary, textColor: C.white, fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: C.gray100 },
        columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 20 } },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }

    // ── 7. RÉSOLUTION ─────────────────────────────────────────
    y = this.checkPageBreak(doc, y, H, 35);
    y = this.drawSection(doc, y, 'Résolution', 'resolution');

    if (complaint.resolution) {
      y = this.drawLabel(doc, y, 'Type de résolution');
      y = this.drawTextBlock(doc, y, W, this.fmtResolutionType(complaint.resolutionType), true);
      y += 3;
      y = this.drawLabel(doc, y, 'Résumé de la solution');
      y = this.drawTextBlock(doc, y, W, complaint.resolution, false);
      if (complaint.closedAt) {
        y += 2;
        y = this.drawLabel(doc, y, 'Date de clôture');
        y = this.drawTextBlock(doc, y, W, this.fmtDate(complaint.closedAt), true);
      }
      if (complaint.satisfactionRating) {
        y += 2;
        y = this.drawLabel(doc, y, 'Note de satisfaction client');
        y = this.drawTextBlock(doc, y, W, `${complaint.satisfactionRating}/5`, true);
      }
    } else {
      y = this.drawEmptyRow(doc, y, W, 'Aucune résolution enregistrée.');
    }

    // ── 8. PIED DE PAGE sur toutes les pages ─────────────────
    this.drawFooters(doc, W, H);

    // ── Téléchargement ────────────────────────────────────────
    const filename = `reclamation-${complaint.ticketNumber ?? complaint.id.substring(0, 8)}-${this.todaySlug()}.pdf`;
    doc.save(filename);
  }

  // ══════════════════════════════════════════════════════════════
  // HELPERS DE RENDU
  // ══════════════════════════════════════════════════════════════

  /** En-tête avec dégradé bleu, logo textuel et métadonnées */
  private drawHeader(doc: jsPDF, W: number, complaint: Complaint): number {
    // Bandeau dégradé bleu
    doc.setFillColor(...C.primary);
    doc.rect(0, 0, W, 38, 'F');

    // Bande orange en bas du header
    doc.setFillColor(...C.orange);
    doc.rect(0, 35, W, 3, 'F');

    // Logo textuel : "Nex" + "lance"
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...C.white);
    doc.text('Nex', 14, 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 200);
    doc.text('lance', 34, 18);

    // Sous-titre logo
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(200, 230, 255);
    doc.text('SMART MATCHING', 14, 24);

    // Titre rapport
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...C.white);
    doc.text('Rapport de Réclamation', W / 2, 14, { align: 'center' });

    // Ticket + date export
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(200, 230, 255);
    doc.text(`Ticket : ${complaint.ticketNumber ?? '—'}`, W / 2, 21, { align: 'center' });
    doc.text(`Exporté le ${this.fmtDate(new Date())}`, W / 2, 27, { align: 'center' });

    // Statut badge (coin droit)
    const statusLabel = STATUS_LABELS[complaint.status] || complaint.status;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...C.white);
    doc.text(statusLabel.toUpperCase(), W - 14, 18, { align: 'right' });

    return 46; // y après l'en-tête
  }

  /** Titre de section avec icône colorie et ligne */
  private drawSection(doc: jsPDF, y: number, title: string, _icon: string): number {
    doc.setFillColor(...C.primary);
    doc.rect(14, y, 3, 7, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...C.gray900);
    doc.text(title, 20, y + 5.5);

    // Ligne sous le titre
    doc.setDrawColor(...C.gray200);
    doc.setLineWidth(0.3);
    doc.line(14, y + 9, 196, y + 9);

    return y + 13;
  }

  /** Grille de paires label / valeur sur 2 colonnes */
  private drawInfoGrid(doc: jsPDF, y: number, W: number, rows: [string, string][]): number {
    const colW  = (W - 28) / 2;
    const rowH  = 8;
    const pairs = this.chunkPairs(rows);

    pairs.forEach(pair => {
      pair.forEach((item, col) => {
        const x = 14 + col * (colW + 4);
        // Label
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...C.gray500);
        doc.text(item[0], x, y);
        // Valeur
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(...C.gray700);
        const val = String(item[1] ?? '—');
        doc.text(this.truncate(val, 45), x, y + 4.5);
      });

      // Ligne de séparation légère
      doc.setDrawColor(...C.gray100);
      doc.setLineWidth(0.2);
      doc.line(14, y + rowH - 1, W - 14, y + rowH - 1);

      y += rowH;
    });

    return y + 4;
  }

  /** Bloc de texte multiligne */
  private drawTextBlock(doc: jsPDF, y: number, W: number, text: string, bold: boolean): number {
    if (!text) return y;
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...C.gray700);

    const lines = doc.splitTextToSize(String(text), W - 28) as string[];
    lines.forEach((line: string) => {
      doc.text(line, 14, y);
      y += 5;
    });
    return y + 2;
  }

  /** Label de champ */
  private drawLabel(doc: jsPDF, y: number, label: string): number {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...C.gray500);
    doc.text(label, 14, y);
    return y + 4;
  }

  /** Ligne "aucun contenu" */
  private drawEmptyRow(doc: jsPDF, y: number, W: number, text: string): number {
    doc.setFillColor(...C.gray100);
    doc.roundedRect(14, y, W - 28, 10, 2, 2, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(...C.gray500);
    doc.text(text, W / 2, y + 6.5, { align: 'center' });
    return y + 14;
  }

  /** Pied de page sur toutes les pages */
  private drawFooters(doc: jsPDF, W: number, H: number): void {
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);

      // Barre de pied
      doc.setFillColor(...C.gray100);
      doc.rect(0, H - 12, W, 12, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...C.gray500);

      // Gauche : mention légale
      doc.text('NexLance — Document confidentiel généré automatiquement', 14, H - 5.5);

      // Centre : date
      doc.text(`Généré le ${this.fmtDate(new Date())}`, W / 2, H - 5.5, { align: 'center' });

      // Droite : numéro de page
      doc.text(`Page ${i} / ${total}`, W - 14, H - 5.5, { align: 'right' });
    }
  }

  /** Saut de page si nécessaire */
  private checkPageBreak(doc: jsPDF, y: number, H: number, needed: number): number {
    if (y + needed > H - 20) {
      doc.addPage();
      return 20;
    }
    return y;
  }

  // ══════════════════════════════════════════════════════════════
  // UTILITAIRES
  // ══════════════════════════════════════════════════════════════

  private fmtDate(date: Date | string | null | undefined): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  private fmtShortDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  }

  private todaySlug(): string {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  }

  private truncate(text: string, max: number): string {
    if (!text) return '—';
    return text.length > max ? text.substring(0, max) + '…' : text;
  }

  /** Découpe un tableau en paires pour affichage 2 colonnes */
  private chunkPairs<T>(arr: T[]): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < arr.length; i += 2) {
      result.push(arr.slice(i, i + 2));
    }
    return result;
  }

  private fmtResolutionType(type?: ResolutionType | string): string {
    const labels: Record<string, string> = {
      REFUND:             'Remboursement',
      WARNING:            'Avertissement',
      ACCOUNT_SUSPENSION: 'Suspension de compte',
      NO_ACTION:          'Aucune action',
      MEDIATION:          'Médiation',
    };
    return type ? (labels[type] ?? type) : '—';
  }
}