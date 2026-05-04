// games/block-attack/controller.tsx
import * as React from "@remix-run/component";
import { renderToString } from "@remix-run/component/server";
import { getSiteBasePath } from "../../app/site-config.js";
import { withBasePath } from "../../app/site-paths.js";
import { Document } from "../../app/ui/document.js";
import {
  GameHeader,
  GameScreen,
  GameTabbedModal,
  InfoAttribution,
  InfoSection,
  SettingsSection,
  SettingsToggle,
  SrOnly
} from "../../app/ui/game-shell.js";

// games/block-attack/attributions.ts
import { repositoryCodeLicense } from "../../app/data/attribution-types.js";
var blockAttackAttribution = {
  slug: "block-attack",
  name: "Block Attack",
  codeLicense: repositoryCodeLicense,
  entries: [
    {
      title: "PixiJS",
      type: "other",
      usedIn: "Block Attack game rendering via PixiJS",
      creator: "PixiJS Contributors",
      source: "https://pixijs.com/",
      sourceUrl: "https://pixijs.com/",
      license: "MIT",
      modifications: "Not applicable",
      notes: "2D WebGL rendering engine used for the game stage."
    }
  ]
};

// games/block-attack/info.ts
var blockAttackInfo = {
  summary: "Smash procedurally generated block towers using your camera! Move to destroy the city like a tiny chaos agent."
};

// games/block-attack/controller.tsx
var modalOverlayStyles = {
  zIndex: 100,
  background: "rgba(6, 6, 18, 0.92)"
};
async function blockAttackAction() {
  const homePath = withBasePath("/", getSiteBasePath());
  const html = await renderToString(
    /* @__PURE__ */ React.createElement(
      Document,
      {
        title: "Block Attack",
        description: "Smash procedurally generated block towers using your camera. Destroy everything in your path!",
        path: "/block-attack/",
        includeNav: false,
        includeFooter: false,
        includeDefaultStyles: false,
        stylesheets: ["/styles/block-attack.css"],
        scripts: ["/client/block-attack/main.js?v=__BUILD_SHA__"],
        bodyClass: "block-attack-game",
        viewportFitCover: true,
        faviconPath: "/favicon.svg",
        manifestPath: "/block-attack/manifest.json",
        serviceWorkerPath: "/block-attack/sw.js",
        serviceWorkerScope: "/block-attack/"
      },
      /* @__PURE__ */ React.createElement("div", { className: "scene-track" }, /* @__PURE__ */ React.createElement(GameScreen, { id: "start-screen", className: "active", labelledBy: "block-attack-title", padded: true }, /* @__PURE__ */ React.createElement("div", { className: "ba-screen-panel ba-start-panel" }, /* @__PURE__ */ React.createElement(
        GameHeader,
        {
          headingId: "block-attack-title",
          className: "ba-header",
          leftContent: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("h1", { id: "block-attack-title", className: "ba-title" }, "Block Attack")),
          rightContent: /* @__PURE__ */ React.createElement(
            "button",
            {
              type: "button",
              className: "ba-menu-btn",
              "data-settings-open": "true",
              "aria-haspopup": "dialog",
              "aria-controls": "settings-modal",
              "aria-expanded": "false"
            },
            "Menu"
          )
        }
      ), /* @__PURE__ */ React.createElement("p", { className: "ba-subtitle" }, "Move your body to smash block towers! Destroy everything!"), /* @__PURE__ */ React.createElement("div", { className: "ba-pose-list", id: "pose-list" }, /* @__PURE__ */ React.createElement("p", { className: "ba-pose-list-title" }, "How to play:"), /* @__PURE__ */ React.createElement("div", { className: "ba-pose-chips" }, /* @__PURE__ */ React.createElement("span", { className: "ba-pose-chip" }, "\u{1F3D7}\uFE0F Towers appear on screen"), /* @__PURE__ */ React.createElement("span", { className: "ba-pose-chip" }, "\u{1F4A5} Move near blocks to smash them"), /* @__PURE__ */ React.createElement("span", { className: "ba-pose-chip" }, "\u{1F517} Destroy supporting blocks to topple towers"), /* @__PURE__ */ React.createElement("span", { className: "ba-pose-chip" }, "\u26A1 Chain hits for combo multipliers!"), /* @__PURE__ */ React.createElement("span", { className: "ba-pose-chip" }, "\u{1F5B1}\uFE0F No camera? Move your mouse instead!"))), /* @__PURE__ */ React.createElement("div", { className: "ba-camera-prompt", id: "camera-denied-msg" }, /* @__PURE__ */ React.createElement("p", null, "Camera access is optional \u2014 you can also use your mouse or touch.")), /* @__PURE__ */ React.createElement("div", { id: "start-controls" }, /* @__PURE__ */ React.createElement("button", { id: "start-btn", type: "button", className: "ba-primary-btn" }, "\u{1F4A5} Start Smash!")))), /* @__PURE__ */ React.createElement(GameScreen, { id: "game-screen", labelledBy: "block-attack-game-heading" }, /* @__PURE__ */ React.createElement("div", { className: "ba-screen-panel ba-game-panel" }, /* @__PURE__ */ React.createElement(
        GameHeader,
        {
          headingId: "block-attack-game-heading",
          className: "ba-header",
          leftContent: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { id: "restart-btn", type: "button", className: "ba-icon-btn", "aria-label": "Restart", title: "Restart" }, "\u21BB"), /* @__PURE__ */ React.createElement("span", { id: "wave-display", className: "ba-hud-item" }, "Wave: 1")),
          rightContent: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { id: "score-display", className: "ba-hud-item" }, "Score: 0"), /* @__PURE__ */ React.createElement("span", { id: "combo-display", className: "ba-hud-item ba-combo" }), /* @__PURE__ */ React.createElement("button", { id: "quit-btn", type: "button", className: "ba-icon-btn ba-quit-btn", "aria-label": "Quit", title: "Quit" }, "\u2715"))
        }
      ), /* @__PURE__ */ React.createElement("div", { className: "ba-floor" }, /* @__PURE__ */ React.createElement("video", { id: "camera-preview", autoPlay: true, playsInline: true, muted: true, "aria-label": "Camera preview" }), /* @__PURE__ */ React.createElement("div", { id: "pixi-stage", "aria-hidden": "true" })))), /* @__PURE__ */ React.createElement(GameScreen, { id: "end-screen", labelledBy: "block-attack-end-heading", padded: true }, /* @__PURE__ */ React.createElement("div", { className: "ba-screen-panel ba-end-panel" }, /* @__PURE__ */ React.createElement(
        GameHeader,
        {
          headingId: "block-attack-end-heading",
          className: "ba-header",
          leftContent: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("h2", { id: "block-attack-end-heading", className: "ba-title" }, "Block Attack")),
          rightContent: /* @__PURE__ */ React.createElement(
            "button",
            {
              type: "button",
              className: "ba-menu-btn",
              "data-settings-open": "true",
              "aria-haspopup": "dialog",
              "aria-controls": "settings-modal",
              "aria-expanded": "false"
            },
            "Menu"
          )
        }
      ), /* @__PURE__ */ React.createElement("p", { id: "end-score-msg", className: "ba-completion-msg" }, "Great smashing!"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("button", { id: "replay-btn", type: "button", className: "ba-primary-btn" }, "Play again")))), /* @__PURE__ */ React.createElement(
        GameTabbedModal,
        {
          title: "Menu",
          overlayStyles: modalOverlayStyles,
          quitHref: homePath,
          settingsContent: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SettingsSection, { title: "Audio" }, /* @__PURE__ */ React.createElement(
            SettingsToggle,
            {
              id: "music-enabled-toggle",
              label: "Sound",
              helpText: "Sound is on until you change it here.",
              helpId: "music-enabled-help"
            }
          ), /* @__PURE__ */ React.createElement(
            SettingsToggle,
            {
              id: "sfx-enabled-toggle",
              label: "Effects",
              helpText: "Sound effects are on until you change it here.",
              helpId: "sfx-enabled-help"
            }
          )), /* @__PURE__ */ React.createElement(SettingsSection, { title: "Controls" }, /* @__PURE__ */ React.createElement("div", { className: "ba-controls-help" }, /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("strong", null, "Move:"), " Move your body near blocks to smash them. Or use your mouse!"), /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("strong", null, "Combo:"), " Hit blocks quickly for score multipliers."), /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("strong", null, "Restart:"), " Press \u21BB or use the menu."), /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("strong", null, "Quit:"), " Press \u2715 or use the menu."))), /* @__PURE__ */ React.createElement(SettingsSection, { title: "Accessibility" }, /* @__PURE__ */ React.createElement(
            SettingsToggle,
            {
              id: "reduce-motion-toggle",
              label: "Reduce motion",
              helpText: "Defaults to your device setting until you change it here.",
              helpId: "reduce-motion-help"
            }
          ))),
          infoContent: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(InfoSection, { title: "About Block Attack" }, /* @__PURE__ */ React.createElement("p", null, blockAttackInfo.summary)), /* @__PURE__ */ React.createElement(InfoSection, { title: "Credits" }, blockAttackAttribution.entries.map((entry) => /* @__PURE__ */ React.createElement(InfoAttribution, { attribution: {
            title: entry.title,
            author: entry.creator,
            license: entry.license,
            url: entry.sourceUrl,
            notes: entry.notes
          } }))))
        }
      )),
      /* @__PURE__ */ React.createElement(SrOnly, { id: "game-status", ariaLive: "polite", ariaAtomic: true }),
      /* @__PURE__ */ React.createElement(SrOnly, { id: "game-feedback", ariaLive: "assertive", ariaAtomic: true }),
      /* @__PURE__ */ React.createElement("noscript", null, /* @__PURE__ */ React.createElement("div", { className: "noscript-message noscript-message-ba" }, /* @__PURE__ */ React.createElement("p", null, "Block Attack needs JavaScript and camera access to track your moves. Turn JavaScript on and reload to play.")))
    )
  );
  return new Response(`<!DOCTYPE html>${html}`, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}
export {
  blockAttackAction
};
