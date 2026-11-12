# Reviews carousel

The homepage and /reviews use the same swipeable review carousel. It supports previous/next buttons, position dots, keyboard arrows, resize handling and reduced-motion preferences. Controls appear when two or more reviews are published. Autoplay advances one card every 4 seconds and loops to the start. It pauses on hover, keyboard focus or the pause control; hidden tabs do not advance. Reduced-motion users start with autoplay paused. Desktop shows five cards, medium screens three, tablets two and phones one.

Open /admin/reviews to add an approved customer review: name, optional destination, rating and review text. Confirm you have permission to publish it. Save as a draft or publish immediately. The library provides Publish and Unpublish controls. Public pages load only published reviews through /api/reviews. Refresh the website after changing publication status.

Eight fictional sample reviews appear as a labelled preview when no real reviews are published, as requested. Samples are kept separate from stored customer feedback and disappear once a real review is published. Review data persists in the existing SQLite database. Admin access remains open as previously requested.

Checks: npm.cmd run test:reviews; node tests/reviews-http.test.cjs after building.

Customers can select Write a review on the homepage carousel or Reviews page. Login/signup returns them to /reviews/write. Submissions use the signed-in customer name and always start as unpublished drafts for approval.
