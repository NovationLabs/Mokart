#!/usr/bin/env python3
"""Draw the SonarQube ratings card used by the Discord webhook."""
import io
from PIL import Image, ImageDraw, ImageFont

BACKGROUND = "#23252e"
LABEL = "#d0d3df"
WHITE = "#ffffff"
GREEN = "#57f287"
RED = "#ff7777"
MUTED = "#aeb1bb"
RATING_COLORS = {"A": "#168a55", "B": "#78a831", "C": "#bb811d",
                 "D": "#e36d27", "E": "#c5221a", "—": "#626777"}


def _font(size, bold=False):
    path = ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold
            else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
    try:
        return ImageFont.truetype(path, size=size)
    except OSError:
        return ImageFont.load_default()


def _center(draw, center_x, y, content, font, color):
    bounds = draw.textbbox((0, 0), content, font=font)
    width = bounds[2] - bounds[0]
    draw.text((center_x - width / 2, y), content, font=font, fill=color)


def create_card(ratings, counts, previous=None):
    """Return PNG bytes; no change arrow is shown without a previous snapshot."""
    previous = previous or {}
    canvas = Image.new("RGB", (960, 320), BACKGROUND)
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((1, 1, 958, 318), radius=20, outline="#404450", width=2)
    draw.text((34, 27), "CODE QUALITY  /  OVERALL", font=_font(21, True), fill=LABEL)
    columns = [
        ("Security", "SECURITY", 160),
        ("Reliability", "RELIABILITY", 480),
        ("Maintainability", "MAINTAINABILITY", 800),
    ]
    for name, key, x in columns:
        grade = ratings[key]
        count = counts[key]
        _center(draw, x, 86, name, _font(23, True), LABEL)
        draw.ellipse((x - 39, 134, x + 39, 212), fill=RATING_COLORS.get(grade, "#626777"))
        _center(draw, x, 145, grade, _font(46, True), WHITE)
        prior = previous.get(key)
        change = count - prior if isinstance(prior, int) else None
        color = GREEN if change is not None and change < 0 else RED if change is not None and change > 0 else WHITE
        text = f"{count} issues"
        font = _font(22, True)
        bounds = draw.textbbox((0, 0), text, font=font)
        width = bounds[2] - bounds[0]
        if change:
            start_x = x - (width + 27) / 2
            # A single small chevron tip, not a long arrow shaft.
            middle = start_x + 8
            if change < 0:
                draw.line([(middle - 7, 249), (middle, 256), (middle + 7, 249)],
                          fill=color, width=4, joint="curve")
            else:
                draw.line([(middle - 7, 256), (middle, 249), (middle + 7, 256)],
                          fill=color, width=4, joint="curve")
            draw.text((start_x + 27, 238), text, font=font, fill=color)
        else:
            _center(draw, x, 238, text, font, color)
        if change:
            _center(draw, x, 275, f"{change:+d} issues", _font(17, True), color)
    output = io.BytesIO()
    canvas.save(output, format="PNG", optimize=True)
    return output.getvalue()
