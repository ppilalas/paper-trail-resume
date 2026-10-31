/**
 * Layout QA gate for the editorial resume system.
 *
 * Runs inside the rendering browser after fonts are ready and print media is
 * emulated. Catches the failures a page-count check cannot see: content that
 * runs into the folio, content that spills past the page content box, and
 * pages with no bottom breathing room at all.
 *
 * Every check throws. Do not remove or loosen a gate to force a render.
 */

const FOLIO_CLEARANCE_PX = 10; // minimum vertical gap between content and the folio
const FOLIO_PADDING_PX = 4; // treat the folio as slightly larger than its box
const EDGE_TOLERANCE_PX = 0.5; // sub-pixel rounding slack

async function checkResumeLayout(page, { minFolioClearance = FOLIO_CLEARANCE_PX } = {}) {
  const report = await page.evaluate(({ minFolioClearance, folioPad, edgeTolerance }) => {
    const pages = [...document.querySelectorAll('.page')];
    const problems = [];
    const summary = [];

    const describe = (el) => {
      const cls = typeof el.className === 'string' ? el.className : '';
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60);
      return `${el.tagName.toLowerCase()}${cls ? '.' + cls.split(/\s+/).join('.') : ''}${text ? ` ("${text}")` : ''}`;
    };

    // Only leaf-ish nodes that actually paint text, so a tall wrapper does not
    // mask which line is really colliding.
    const paintsText = (el) => {
      for (const node of el.childNodes) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) return true;
      }
      return false;
    };

    pages.forEach((pageEl, index) => {
      const pageNumber = index + 1;
      const pr = pageEl.getBoundingClientRect();
      const cs = getComputedStyle(pageEl);
      const box = {
        top: pr.top + parseFloat(cs.paddingTop),
        bottom: pr.bottom - parseFloat(cs.paddingBottom),
        left: pr.left + parseFloat(cs.paddingLeft),
        right: pr.right - parseFloat(cs.paddingRight),
      };

      const folio = pageEl.querySelector('.folio');
      const fr = folio ? folio.getBoundingClientRect() : null;
      if (!folio) problems.push(`Page ${pageNumber}: no .folio element found`);

      let lowestContent = -Infinity;
      let lowestNode = null;

      pageEl.querySelectorAll('*').forEach((el) => {
        if (folio && (el === folio || folio.contains(el) || el.contains(folio))) return;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        if (getComputedStyle(el).visibility === 'hidden') return;

        if (paintsText(el) && r.bottom > lowestContent) {
          lowestContent = r.bottom;
          lowestNode = el;
        }

        if (r.bottom > box.bottom + edgeTolerance) {
          problems.push(`Page ${pageNumber}: content extends ${(r.bottom - box.bottom).toFixed(1)}px below the content box - ${describe(el)}`);
        }
        if (r.right > box.right + edgeTolerance) {
          problems.push(`Page ${pageNumber}: content extends ${(r.right - box.right).toFixed(1)}px past the right content edge - ${describe(el)}`);
        }
        if (r.left < box.left - edgeTolerance) {
          problems.push(`Page ${pageNumber}: content extends ${(box.left - r.left).toFixed(1)}px past the left content edge - ${describe(el)}`);
        }

        if (fr && paintsText(el)) {
          const hitsFolio =
            r.left < fr.right + folioPad &&
            r.right > fr.left - folioPad &&
            r.top < fr.bottom + folioPad &&
            r.bottom > fr.top - folioPad;
          if (hitsFolio) {
            problems.push(`Page ${pageNumber}: text overlaps the folio - ${describe(el)}`);
          }
        }
      });

      let clearance = null;
      if (fr && lowestNode) {
        clearance = fr.top - lowestContent;
        if (clearance < minFolioClearance) {
          problems.push(`Page ${pageNumber}: only ${clearance.toFixed(1)}px between the last line of content and the folio (minimum ${minFolioClearance}px) - ${describe(lowestNode)}`);
        }
      }

      summary.push({
        page: pageNumber,
        contentBottom: +lowestContent.toFixed(1),
        boxBottom: +box.bottom.toFixed(1),
        folioTop: fr ? +fr.top.toFixed(1) : null,
        folioClearance: clearance === null ? null : +clearance.toFixed(1),
      });
    });

    return { problems, summary };
  }, { minFolioClearance, folioPad: FOLIO_PADDING_PX, edgeTolerance: EDGE_TOLERANCE_PX });

  if (report.problems.length) {
    throw new Error('Layout QA failed:\n  - ' + report.problems.join('\n  - '));
  }

  return report.summary;
}

module.exports = { checkResumeLayout, FOLIO_CLEARANCE_PX };
