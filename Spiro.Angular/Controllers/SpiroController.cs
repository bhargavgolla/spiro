﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Spiro.Modern.Angular.Controllers {
    public class SpiroController : Controller {
        public ActionResult Index() {
            return View("Modern");
        }
    }
}
