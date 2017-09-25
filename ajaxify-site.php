<?php
/*
    Plugin Name: Ajaxify Site
    Description: Provides the ability to create single-page applications
    Version: 1.0
    Author: PAYMO
    Author URI: https://paymo.ru/
 ---------------------------------------------------------------------
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
---------------------------------------------------------------------
*/

add_action('wp_enqueue_scripts', 'as_load_scripts');

/**
 *    Function name: apd_load_scripts
 *    Description: Loading the required js files and adding required php variable to js variable.
 */
function as_load_scripts()
{
    if (!wp_script_is('jquery')) {
        wp_enqueue_script('jquery');
    }
    $plugin_dir_path = plugin_dir_url(__FILE__);

    wp_enqueue_script('history-js', $plugin_dir_path . 'js/history.js', array('jquery'));
    wp_enqueue_script('ajaxify-js', $plugin_dir_path . 'js/ajaxify.js', array('jquery'));

    include_once(ABSPATH . 'wp-admin/includes/plugin.php');
}
