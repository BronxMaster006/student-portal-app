import adsk.core
import adsk.fusion
import traceback


def mm(value):
    return value / 10.0


def create_component(root: adsk.fusion.Component, name: str) -> adsk.fusion.Component:
    occ = root.occurrences.addNewComponent(adsk.core.Matrix3D.create())
    occ.component.name = name
    return occ.component


def create_offset_plane(component: adsk.fusion.Component, base_plane, offset_mm: float):
    planes = component.constructionPlanes
    plane_input = planes.createInput()
    plane_input.setByOffset(base_plane, adsk.core.ValueInput.createByReal(mm(offset_mm)))
    return planes.add(plane_input)


def create_center_rectangle(sketch: adsk.fusion.Sketch, cx_mm: float, cy_mm: float, width_mm: float, height_mm: float):
    center = adsk.core.Point3D.create(mm(cx_mm), mm(cy_mm), 0)
    corner = adsk.core.Point3D.create(mm(cx_mm + width_mm / 2.0), mm(cy_mm + height_mm / 2.0), 0)
    return sketch.sketchCurves.sketchLines.addCenterPointRectangle(center, corner)


def create_circle(sketch: adsk.fusion.Sketch, cx_mm: float, cy_mm: float, diameter_mm: float):
    return sketch.sketchCurves.sketchCircles.addByCenterRadius(
        adsk.core.Point3D.create(mm(cx_mm), mm(cy_mm), 0),
        mm(diameter_mm / 2.0),
    )


def extrude_profile(component: adsk.fusion.Component, profile, distance_mm: float, operation):
    extrudes = component.features.extrudeFeatures
    ext_input = extrudes.createInput(profile, operation)
    ext_input.setDistanceExtent(False, adsk.core.ValueInput.createByReal(mm(distance_mm)))
    return extrudes.add(ext_input)


def create_box_body(component: adsk.fusion.Component, plane, cx, cy, width, height, depth, operation=adsk.fusion.FeatureOperations.NewBodyFeatureOperation):
    sk = component.sketches.add(plane)
    create_center_rectangle(sk, cx, cy, width, height)
    return extrude_profile(component, sk.profiles.item(0), depth, operation)


def cut_circle_through(component: adsk.fusion.Component, plane, cx, cy, diameter, depth_mm):
    sk = component.sketches.add(plane)
    create_circle(sk, cx, cy, diameter)
    return extrude_profile(component, sk.profiles.item(0), depth_mm, adsk.fusion.FeatureOperations.CutFeatureOperation)


def add_mounting_holes(component, plane, positions, diameter_mm, depth_mm):
    for x, y in positions:
        cut_circle_through(component, plane, x, y, diameter_mm, depth_mm)


def create_front_frame(root, p):
    comp = create_component(root, 'Teil_1_Front_Rahmen')
    body = create_box_body(comp, comp.xYConstructionPlane, 0, 0, p['outer_width'], p['outer_height'], p['frame_depth'])

    sk = comp.sketches.add(comp.xYConstructionPlane)
    create_center_rectangle(sk, 0, p['inner_center_y'], p['inner_width'], p['inner_height'])
    extrude_profile(comp, sk.profiles.item(0), p['frame_depth'], adsk.fusion.FeatureOperations.CutFeatureOperation)

    holes = [(-72, 42), (72, 42), (-72, -42), (72, -42)]
    add_mounting_holes(comp, comp.xYConstructionPlane, holes, 2.0, p['frame_depth'])
    return comp


def create_panel_frame(comp, name, x, y, z, panel_w, panel_h, t, rail_tab=False, pin=False, drive_tab=False, side='left'):
    base_plane = create_offset_plane(comp, comp.xYConstructionPlane, z)
    sk = comp.sketches.add(base_plane)
    create_center_rectangle(sk, x, y, panel_w, panel_h)
    extrude_profile(comp, sk.profiles.item(0), t, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)

    frame = 3.0
    bottom = 5.0
    sk2 = comp.sketches.add(base_plane)
    inner_h = panel_h - (frame + bottom)
    inner_y = y + (bottom - frame) / 2.0
    create_center_rectangle(sk2, x, inner_y, panel_w - 2 * frame, inner_h)
    extrude_profile(comp, sk2.profiles.item(0), t, adsk.fusion.FeatureOperations.CutFeatureOperation)

    # Mittelsteg
    bar_w = 3.0
    bar_h = panel_h - 12.0
    bar_x = x + (panel_w / 2.0 - 7.0) if side == 'left' else x - (panel_w / 2.0 - 7.0)
    sk3 = comp.sketches.add(base_plane)
    create_center_rectangle(sk3, bar_x, y + 1.0, bar_w, bar_h)
    extrude_profile(comp, sk3.profiles.item(0), t, adsk.fusion.FeatureOperations.JoinFeatureOperation)

    if rail_tab:
        tab_plane = create_offset_plane(comp, comp.xYConstructionPlane, z + t)
        create_box_body(comp, tab_plane, x, y + panel_h / 2.0 + 1.2, 6.0, 2.4, 2.0)
    if pin:
        pin_plane = create_offset_plane(comp, comp.xYConstructionPlane, z - 1.2)
        create_box_body(comp, pin_plane, x, y - panel_h / 2.0 - 0.8, 1.2, 1.2, 1.8)
    if drive_tab:
        drive_plane = create_offset_plane(comp, comp.xYConstructionPlane, z + t)
        create_box_body(comp, drive_plane, x + (8 if side == 'left' else -8), y + panel_h / 2.0 - 5.0, 5.0, 4.0, 2.0)
        hole_plane = create_offset_plane(comp, comp.xYConstructionPlane, z + t)
        cut_circle_through(comp, hole_plane, x + (8 if side == 'left' else -8), y + panel_h / 2.0 - 5.0, 1.2, 2.0)


def create_fixed_panel(root, p, side):
    name = 'Teil_2_Festes_Glasteil_Links' if side == 'left' else 'Teil_3_Festes_Glasteil_Rechts'
    comp = create_component(root, name)
    x = -56.5 if side == 'left' else 56.5
    create_panel_frame(comp, name, x, p['y_center'], p['z_fixed'], p['panel_width'], p['panel_height'], p['panel_thickness'], side=side)
    return comp


def create_moving_panel(root, p, side):
    name = 'Teil_4_Beweglicher_Tuerfluegel_Links' if side == 'left' else 'Teil_5_Beweglicher_Tuerfluegel_Rechts'
    comp = create_component(root, name)
    x = -18.5 if side == 'left' else 18.5
    create_panel_frame(comp, name, x, p['y_center'], p['z_moving'], p['panel_width'], p['panel_height'], p['panel_thickness'], rail_tab=True, pin=True, drive_tab=True, side=side)
    return comp


def create_upper_rail_v2(root, p):
    comp = create_component(root, 'Teil_6_Obere_Laufschiene_V2')
    z = p['z_moving'] + p['panel_thickness'] + 1.8
    base = create_offset_plane(comp, comp.xYConstructionPlane, z)
    create_box_body(comp, base, 0, p['y_center'] + p['panel_height'] / 2.0 + 3.8, 150.0, 9.0, 10.0)

    cut_plane = create_offset_plane(comp, comp.xYConstructionPlane, z + 2.0)
    create_box_body(comp, cut_plane, 0, p['y_center'] + p['panel_height'] / 2.0 + 3.8, 146.0, 3.0, 6.0, adsk.fusion.FeatureOperations.CutFeatureOperation)
    return comp


def create_lower_guide_v2(root, p):
    comp = create_component(root, 'Teil_7_Untere_Fuehrungsschiene_V2')
    z = p['z_moving'] - 2.8
    base = create_offset_plane(comp, comp.xYConstructionPlane, z)
    create_box_body(comp, base, 0, p['y_center'] - p['panel_height'] / 2.0 - 3.0, 150.0, 6.0, 2.4)

    nut_plane = create_offset_plane(comp, comp.xYConstructionPlane, z + 0.6)
    create_box_body(comp, nut_plane, 0, p['y_center'] - p['panel_height'] / 2.0 - 3.0, 148.0, 1.8, 1.8, adsk.fusion.FeatureOperations.CutFeatureOperation)
    return comp


def create_tech_box(root, p):
    comp = create_component(root, 'Teil_8_Technik_Kasten_SG90')
    plane = create_offset_plane(comp, comp.xYConstructionPlane, p['tech_z'])
    create_box_body(comp, plane, 0, p['tech_y'], p['tech_box_width'], p['tech_box_height'], p['tech_box_depth'])

    inner_plane = create_offset_plane(comp, comp.xYConstructionPlane, p['tech_z'] + p['wall'])
    create_box_body(comp, inner_plane, 0, p['tech_y'], p['tech_box_width'] - 2 * p['wall'], p['tech_box_height'] - 2 * p['wall'], p['tech_box_depth'] - p['wall'], adsk.fusion.FeatureOperations.CutFeatureOperation)

    cable_plane = create_offset_plane(comp, comp.xYConstructionPlane, p['tech_z'])
    create_box_body(comp, cable_plane, 0, p['tech_y'] - p['tech_box_height'] / 2.0 + 4.0, 20.0, 4.0, 4.0, adsk.fusion.FeatureOperations.CutFeatureOperation)
    return comp


def create_servo_holder(root, p, side):
    name = 'Teil_9A_SG90_Halter_Links' if side == 'left' else 'Teil_9B_SG90_Halter_Rechts'
    comp = create_component(root, name)
    x = -32 if side == 'left' else 32
    z = p['tech_z'] + 3
    y = p['tech_y'] - 2
    base = create_offset_plane(comp, comp.xYConstructionPlane, z)
    create_box_body(comp, base, x, y, 28, 18, 2.0)
    create_box_body(comp, base, x - 12, y, 2.0, 18, 16)
    create_box_body(comp, base, x + 12, y, 2.0, 18, 16)
    create_box_body(comp, base, x, y - 8, 28, 2.0, 16)

    pocket = create_offset_plane(comp, comp.xYConstructionPlane, z + 2.0)
    create_box_body(comp, pocket, x, y + 2.5, 24.6, 14.6, 14.0, adsk.fusion.FeatureOperations.CutFeatureOperation)

    for dx in (-10, 10):
        cut_circle_through(comp, base, x + dx, y, 2.0, 2.0)
    return comp


def create_spool(root, p, side):
    name = 'Teil_10A_Trommel_Links_24mm' if side == 'left' else 'Teil_10B_Trommel_Rechts_24mm'
    comp = create_component(root, name)
    sk = comp.sketches.add(comp.xYConstructionPlane)
    create_circle(sk, 0, 0, 24.0)
    ext = extrude_profile(comp, sk.profiles.item(0), 1.2, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)

    p2 = create_offset_plane(comp, comp.xYConstructionPlane, 1.2)
    sk2 = comp.sketches.add(p2)
    create_circle(sk2, 0, 0, 18.0)
    extrude_profile(comp, sk2.profiles.item(0), 5.6, adsk.fusion.FeatureOperations.JoinFeatureOperation)

    p3 = create_offset_plane(comp, comp.xYConstructionPlane, 6.8)
    sk3 = comp.sketches.add(p3)
    create_circle(sk3, 0, 0, 24.0)
    extrude_profile(comp, sk3.profiles.item(0), 1.2, adsk.fusion.FeatureOperations.JoinFeatureOperation)

    cut_circle_through(comp, comp.xYConstructionPlane, 0, 0, 5.0, 8.0)
    for angle in (0, 90, 180, 270):
        import math
        r = 4.5
        cut_circle_through(comp, comp.xYConstructionPlane, r * math.cos(math.radians(angle)), r * math.sin(math.radians(angle)), 1.8, 8.0)
    cut_circle_through(comp, comp.xYConstructionPlane, 8.0, 0.0, 1.2, 8.0)
    return comp


def create_tech_box_lid(root, p):
    comp = create_component(root, 'Teil_11_Deckel_Technik_Kasten')
    plane = create_offset_plane(comp, comp.xYConstructionPlane, p['tech_z'] + p['tech_box_depth'])
    create_box_body(comp, plane, 0, p['tech_y'], 156.0, 34.0, 2.0)

    lip_plane = create_offset_plane(comp, comp.xYConstructionPlane, p['tech_z'] + p['tech_box_depth'] - 1.2)
    create_box_body(comp, lip_plane, 0, p['tech_y'], 151.4, 29.4, 1.2)

    grip_plane = create_offset_plane(comp, comp.xYConstructionPlane, p['tech_z'] + p['tech_box_depth'])
    create_box_body(comp, grip_plane, 0, p['tech_y'] + 13.0, 20.0, 5.0, 1.0, adsk.fusion.FeatureOperations.CutFeatureOperation)
    return comp


def create_guide_eye(root, p, name, x, y, z):
    comp = create_component(root, name)
    plane = create_offset_plane(comp, comp.xYConstructionPlane, z)
    create_box_body(comp, plane, x, y, 12.0, 6.0, 1.8)
    post_plane = create_offset_plane(comp, comp.xYConstructionPlane, z + 1.8)
    create_box_body(comp, post_plane, x, y, 7.0, 2.0, 8.0)
    hole_plane = create_offset_plane(comp, comp.xYConstructionPlane, z + 1.8)
    cut_circle_through(comp, hole_plane, x, y, 1.6, 8.0)
    cut_circle_through(comp, plane, x - 3.5, y, 1.5, 1.8)
    cut_circle_through(comp, plane, x + 3.5, y, 1.5, 1.8)
    return comp


def create_end_stops(root, p):
    comp = create_component(root, 'Teil_13_Endanschlaege')
    z = p['z_moving'] + p['panel_thickness']
    plane = create_offset_plane(comp, comp.xYConstructionPlane, z)
    for x in (-19.5, 19.5, -56.5, 56.5, -94.0, 94.0):
        create_box_body(comp, plane, x, p['y_center'] + p['panel_height'] / 2.0 + 3.5, 3.0, 3.0, 3.0)
    return comp


def run(context):
    ui = None
    try:
        app = adsk.core.Application.get()
        ui = app.userInterface
        design = adsk.fusion.Design.cast(app.activeProduct)
        if not design:
            ui.messageBox('Kein aktives Fusion-360-Design gefunden.')
            return

        root = design.rootComponent
        params = {
            'scale': 25,
            'outer_width': 156.0,
            'outer_height': 98.0,
            'frame_depth': 8.0,
            'side_frame': 3.0,
            'top_frame': 8.0,
            'bottom_frame': 2.0,
            'inner_width': 150.0,
            'inner_height': 88.0,
            'inner_center_y': -3.0,
            'panel_width': 38.0,
            'panel_height': 84.0,
            'panel_thickness': 2.0,
            'y_center': -3.0,
            'z_fixed': 8.4,
            'z_moving': 10.8,
            'tech_box_width': 156.0,
            'tech_box_height': 34.0,
            'tech_box_depth': 26.0,
            'wall': 2.0,
            'tech_y': 55.0,
            'tech_z': -26.0,
        }

        created = []
        created.append(create_front_frame(root, params).name)
        created.append(create_fixed_panel(root, params, 'left').name)
        created.append(create_fixed_panel(root, params, 'right').name)
        created.append(create_moving_panel(root, params, 'left').name)
        created.append(create_moving_panel(root, params, 'right').name)
        created.append(create_upper_rail_v2(root, params).name)
        created.append(create_lower_guide_v2(root, params).name)
        created.append(create_tech_box(root, params).name)
        created.append(create_servo_holder(root, params, 'left').name)
        created.append(create_servo_holder(root, params, 'right').name)
        created.append(create_spool(root, params, 'left').name)
        created.append(create_spool(root, params, 'right').name)
        created.append(create_tech_box_lid(root, params).name)
        created.append(create_guide_eye(root, params, 'Teil_12A_Umlenkoese_Links_Aussen', -70, 52, -3).name)
        created.append(create_guide_eye(root, params, 'Teil_12B_Umlenkoese_Links_Mitte', -24, 52, -3).name)
        created.append(create_guide_eye(root, params, 'Teil_12C_Umlenkoese_Rechts_Mitte', 24, 52, -3).name)
        created.append(create_guide_eye(root, params, 'Teil_12D_Umlenkoese_Rechts_Aussen', 70, 52, -3).name)
        created.append(create_end_stops(root, params).name)

        app.activeViewport.fit()
        ui.messageBox('Master-Skript erfolgreich ausgeführt.\n\nErzeugte Komponenten:\n- ' + '\n- '.join(created))

    except Exception:
        if ui:
            ui.messageBox('Fehler im Master-Skript:\n{}'.format(traceback.format_exc()))

